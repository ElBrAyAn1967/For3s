// Store de usuarios de las demos — respaldado por Postgres (for3s_demo).
//
// Identidad por (kind, correo normalizado). Cada demo tiene su tope:
//   general = 10 (con lista de espera) · jazz/mashe/brian = 1 (1:1).
// Sesión persistente: volver con el mismo nombre+correo continúa donde se quedó.
//
// Toda la lógica de capacidad/cola vive en SQL, SIEMPRE filtrada por `kind`
// (las sesiones de una demo no afectan el cupo de otra).
//
// Una sesión "ocupa cupo" si status='active' y last_seen_at es reciente. Las que
// dejan de dar señales (cerraron pestaña) se reapean a 'released' pero su
// registro persiste (pueden volver con su correo).

import type { Sql } from "postgres";
import { cupoDe, cupoTotalActivas, instanciasActivas, getInstancia } from "./instancias"; // C3: cupo desde demo_instancias
import { sesionTtlMs, panelCupoModo } from "./config"; // parámetros desde demo_config
import { nombreDeHilo } from "./hilos"; // estándar único del nombre de hilo
import {
  type RegisterResult,
  type RegisterDenied,
  type DemoUser,
  type DemoKind,
} from "./types";
import { db } from "./db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlLike = Sql<any>;

/**
 * O-F3 · Contexto de UNA operación (memoización por request).
 * Dentro de una misma operación, el cupo de la instancia y el nº de activos se
 * consultaban varias veces (cupoDe 4×, activeCount 3×) — el mismo dato, varios
 * viajes a Neon. Este contexto lo resuelve UNA vez y lo reusa.
 * Se invalida a mano (`ctx.activos = undefined`) cuando una escritura lo cambia,
 * para no servir un valor viejo. Vive solo lo que dura la operación.
 */
interface OpCtx {
  cupo?: number;
  activos?: number;
}

/**
 * O-F5 · Freno del mantenimiento en el heartbeat.
 * El latido corre cada 5 s POR USUARIO: con 100 usuarios son 20 latidos/seg, y en
 * cada uno se liberaban sesiones muertas y se promovía la cola aunque no hubiera
 * nada que hacer. Ahora ese mantenimiento corre como mucho una vez cada
 * MANTENIMIENTO_MS POR INSTANCIA (no por usuario).
 *
 * Efecto observable idéntico: el TTL de sesión no cambia, así que una sesión muerta
 * se libera igual; solo se DETECTA en la siguiente pasada. Con 15 s de intervalo el
 * retraso máximo es de 15 s sobre un TTL de 60 s — imperceptible para el usuario.
 *
 * El registro/logout NO pasan por este freno: ahí el mantenimiento corre siempre
 * (son eventos raros donde sí importa la exactitud inmediata del cupo).
 */
const MANTENIMIENTO_MS = 15_000;
const ultimoMantenimiento = new Map<string, number>();

function tocaMantenimiento(instancia: string, now: number): boolean {
  const prev = ultimoMantenimiento.get(instancia) ?? 0;
  if (now - prev < MANTENIMIENTO_MS) return false;
  ultimoMantenimiento.set(instancia, now);
  return true;
}

/** Cupo de la instancia, memoizado en el contexto de la operación. */
async function cupoDeCtx(kind: DemoKind, ctx?: OpCtx): Promise<number> {
  if (ctx?.cupo !== undefined) return ctx.cupo;
  const v = await cupoDe(kind);
  if (ctx) ctx.cupo = v;
  return v;
}

// Marca como 'released' las sesiones activas sin heartbeat reciente (de un kind).
// El TTL sale de demo_config.sesion_ttl_seg (editable sin push; default 60s).
async function reapStale(sql: SqlLike, kind: DemoKind, now: number): Promise<void> {
  const cutoff = new Date(now - (await sesionTtlMs()));
  await sql`
    UPDATE demo_users SET status = 'released'
    WHERE instancia = ${kind} AND status = 'active' AND last_seen_at < ${cutoff}
  `;
}

// O-F3 · memoizado por operación: el mismo conteo se pedía hasta 3 veces.
async function activeCount(
  sql: SqlLike,
  kind: DemoKind,
  ctx?: OpCtx,
): Promise<number> {
  if (ctx?.activos !== undefined) return ctx.activos;
  const [row] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM demo_users WHERE instancia = ${kind} AND status = 'active'
  `;
  const n = row?.n ?? 0;
  if (ctx) ctx.activos = n;
  return n;
}

// Promueve de la cola (FIFO) mientras haya cupo en ese kind. Recalcula posiciones.
// Devuelve los correos recién promovidos (para notificar — stub email).
// O-F1 · sin N+1: promueve a TODOS los que caben en UN solo UPDATE (antes era un
//        UPDATE por persona → 10 en cola = 10 viajes a Neon).
// O-F2 · sin trabajo inútil: si NO hay nadie esperando, sale sin tocar nada (el caso
//        del 99% de los latidos). Antes recalculaba posiciones siempre.
// Mismo comportamiento observable: FIFO por last_seen_at, posiciones recalculadas.
async function promote(
  sql: SqlLike,
  kind: DemoKind,
  ctx?: OpCtx,
): Promise<string[]> {
  // ¿Hay alguien en cola? Una consulta barata que evita TODO el resto si no.
  const [espera] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM demo_users
    WHERE instancia = ${kind} AND status = 'waiting'
  `;
  if ((espera?.n ?? 0) === 0) return []; // O-F2: nada que promover ni renumerar

  const max = await cupoDeCtx(kind, ctx); // O-F3: memoizado por operación
  const active = await activeCount(sql, kind, ctx);
  const free = max - active;

  let promoted: string[] = [];
  if (free > 0) {
    // O-F1: un solo UPDATE para todos los que caben (CTE con el orden FIFO).
    const filas = await sql<{ email: string }[]>`
      WITH elegidos AS (
        SELECT id FROM demo_users
        WHERE instancia = ${kind} AND status = 'waiting'
        ORDER BY last_seen_at ASC LIMIT ${free}
      )
      UPDATE demo_users u SET status='active', position=NULL
      FROM elegidos e WHERE u.id = e.id
      RETURNING u.email
    `;
    promoted = filas.map((f) => f.email);
    if (ctx) ctx.activos = undefined; // el conteo cambió → invalidar memo
  }

  // Renumerar la cola restante (solo si aún queda gente esperando).
  await sql`
    WITH ordered AS (
      SELECT id, row_number() OVER (ORDER BY last_seen_at ASC) AS rn
      FROM demo_users WHERE instancia = ${kind} AND status = 'waiting'
    )
    UPDATE demo_users u SET position = o.rn FROM ordered o WHERE u.id = o.id
  `;
  return promoted;
}

async function buildResult(
  sql: SqlLike,
  kind: DemoKind,
  email: string,
  returning: boolean,
  ctx?: OpCtx, // O-F3: reusa cupo/activos ya resueltos en esta operación
): Promise<RegisterResult> {
  // O-F4 · UNA sola query: los datos de la persona + el conteo de activos de su
  // instancia salían en 2 viajes; ahora van juntos (el count es un subselect sobre
  // la misma tabla). Si el conteo ya estaba memoizado (O-F3) se reusa ese valor.
  const [u] = await sql<
    {
      status: string;
      position: number | null;
      api_key_enc: string | null;
      api_key_hint: string | null;
      agent_on: boolean;
      activos: number;
    }[]
  >`
    SELECT status, position, api_key_enc, api_key_hint, agent_on,
           (SELECT count(*)::int FROM demo_users
             WHERE instancia = ${kind} AND status = 'active') AS activos
    FROM demo_users WHERE instancia = ${kind} AND lower(email) = ${email}
  `;
  // Si la persona no existe en esta instancia, el count viene sin fila → se pide aparte.
  const active =
    u?.activos ?? ctx?.activos ?? (await activeCount(sql, kind, ctx));
  if (ctx && u?.activos !== undefined) ctx.activos = u.activos; // alimenta el memo
  return {
    status: (u?.status ?? "released") as RegisterResult["status"],
    position: u?.position ?? null,
    returning,
    activeCount: active,
    maxConcurrent: await cupoDeCtx(kind, ctx), // O-F3: memoizado
    hasApiKey: !!u?.api_key_enc,
    apiKeyHint: u?.api_key_hint ?? null,
    agentOn: u?.agent_on ?? true,
    // S4a · "es de pago" = la instancia es 1:1, según demo_instancias. Va como DATO
    // al cliente para que la UI no tenga que deducirlo del nombre. getInstancia
    // está cacheada (10s), así que no añade viaje a Neon en la práctica.
    esPago: (await getInstancia(kind))?.modo === "1:1",
  };
}

// `name`/`email` ya normalizados (minúsculas). Reglas de identidad:
//  - Acceso = nombre + correo. Para CONTINUAR, AMBOS deben coincidir.
//  - Correo existe (en este kind) + nombre distinto → 'name_mismatch'.
//  - Correo no existe → registro nuevo (vincula nombre↔correo).
export async function registerOrResume(
  kind: DemoKind,
  name: string,
  email: string,
  now: number,
): Promise<RegisterResult | RegisterDenied> {
  const sql = db();
  return sql.begin(async (tx) => {
    const t = tx as unknown as SqlLike;
    const ctx: OpCtx = {}; // O-F3: memo de cupo/activos para TODA esta operación
    await reapStale(t, kind, now);
    const seen = new Date(now);
    const max = await cupoDeCtx(kind, ctx); // O-F3: memoizado

    const [existing] = await tx<{ id: string; name: string }[]>`
      SELECT id, name FROM demo_users WHERE instancia = ${kind} AND lower(email) = ${email}
    `;

    if (existing) {
      if (existing.name !== name) {
        return { error: "name_mismatch" } satisfies RegisterDenied;
      }
      // HALLAZGO 2 · el rol se RECALCULA en cada entrada, no solo al crear.
      // Antes solo se decidía al registrar: si hacías dueño a alguien que ya había
      // entrado, seguía como 'visitante' para siempre. Ahora, si su correo está en
      // demo_duenos de esta instancia, se corrige (y su hilo pasa al base 'general').
      const [d] = await tx<{ n: number }[]>`
        SELECT count(*)::int AS n FROM demo_duenos
        WHERE lower(email)=${email} AND instancia=${kind}
      `;
      const rolAhora = (d?.n ?? 0) > 0 ? "dueno" : "visitante";
      await tx`
        UPDATE demo_users
        SET rol = ${rolAhora},
            hilo_nombre = ${nombreDeHilo(rolAhora, name, email)},
            last_seen_at = ${seen},
            status = CASE
              WHEN status IN ('released','connecting') AND
                   (SELECT count(*) FROM demo_users WHERE instancia = ${kind} AND status='active') < ${max}
                THEN 'active'
              WHEN status IN ('released','connecting')
                THEN 'waiting'
              ELSE status
            END
        WHERE id = ${existing.id}
      `;
      await promote(t, kind, ctx);
      return buildResult(t, kind, email, true, ctx);
    }

    const active = await activeCount(t, kind, ctx);
    const status = active < max ? "active" : "waiting";
    // C2 · doble-escritura (transición): escribe kind (viejo) E instancia/rol/
    // hilo_nombre (nuevo) a la vez. rol = 'dueno' si el correo está en demo_duenos
    // para esta instancia, si no 'visitante'. hilo = 'general' (dueño) | 'hilo-<nombre>'.
    // Derivado en SQL para que sea atómico y no cambie la firma de la función.
    const esDueno = await tx<{ n: number }[]>`
      SELECT count(*)::int AS n FROM demo_duenos
      WHERE lower(email)=${email} AND instancia=${kind}
    `;
    const rol = (esDueno[0]?.n ?? 0) > 0 ? "dueno" : "visitante";
    // HALLAZGO 3 · nombre de hilo por el estándar único (lib/demo/hilos.ts):
    // dueño → 'general'; invitado → hilo-<nombre>-<sufijo del correo>, ÚNICO por
    // correo (antes solo el nombre → dos personas homónimas compartían hilo).
    const hilo = nombreDeHilo(rol, name, email);
    await tx`
      INSERT INTO demo_users (kind, instancia, name, email, status, rol, hilo_nombre, created_at, last_seen_at)
      VALUES (${kind}, ${kind}, ${name}, ${email}, ${status}, ${rol}, ${hilo}, ${seen}, ${seen})
    `;
    ctx.activos = undefined; // se insertó una fila → invalidar memo
    await promote(t, kind, ctx);
    return buildResult(t, kind, email, false, ctx);
  });
}

/**
 * Un dueño verificó su código: su PERSONA debe vivir en SU instancia (no en general).
 * Cumple la regla "un dueño = su oficina". Crea/actualiza la fila del dueño en su
 * instancia (rol='dueno', hilo='general' = el hilo base de su agente) y BORRA su
 * registro erróneo en 'general' (donde entró por la puerta pública antes de verificar).
 * Idempotente. Se llama desde verify/check tras validar el código.
 */
/**
 * ⭐ LA INSTANCIA REAL donde vive una persona (por su correo), sin importar el
 * `kind` de la cookie (que solo dice por dónde ENTRÓ). Un dueño verificado vive en
 * SU instancia (brian) aunque entró por 'general' → operar con el kind de la cookie
 * hace que el WHERE no encuentre su fila y la operación se pierda en el vacío.
 * Devuelve null si la persona no existe. REGLA: toda operación sobre UNA persona
 * debe ubicarla con esto (o por correo), nunca con el kind de la cookie.
 */
export async function instanciaRealDe(email: string): Promise<string | null> {
  const sql = db();
  const [u] = await sql<{ instancia: string }[]>`
    SELECT instancia FROM demo_users WHERE lower(email) = ${email.trim().toLowerCase()}
    ORDER BY last_seen_at DESC LIMIT 1
  `;
  return u?.instancia ?? null;
}

/**
 * Hilo (tema) donde conversa esta persona en su agente. Es el nombre que el sitio
 * manda EXPLÍCITAMENTE al canal API: dueño → 'general' (su memoria de siempre);
 * invitado/visitante → 'hilo-<nombre>-<sufijo>' (aislado, ver lib/demo/hilos.ts).
 * Devuelve null si la persona no existe → el caller NO debe inventar un tema.
 */
export async function hiloDe(email: string): Promise<string | null> {
  const sql = db();
  const [u] = await sql<{ hilo_nombre: string | null }[]>`
    SELECT hilo_nombre FROM demo_users WHERE lower(email)=${email.trim().toLowerCase()}
    ORDER BY last_seen_at DESC LIMIT 1
  `;
  return u?.hilo_nombre ?? null;
}

/** Nombre registrado de un correo (busca su fila más reciente en cualquier instancia). */
export async function nombreDe(email: string): Promise<string | null> {
  const sql = db();
  const [u] = await sql<{ name: string }[]>`
    SELECT name FROM demo_users WHERE lower(email)=${email.trim().toLowerCase()}
    ORDER BY last_seen_at DESC LIMIT 1
  `;
  return u?.name ?? null;
}

export async function promoverDuenoAsuInstancia(
  instancia: string,
  email: string,
  name: string,
  now: number,
): Promise<void> {
  const sql = db();
  const correo = email.trim().toLowerCase();
  const nombre = name.trim().toLowerCase();
  const seen = new Date(now);
  await sql.begin(async (tx) => {
    // 0) Rescatar la API key que el dueño pudo haber guardado en su fila 'general'
    //    (la guardó ahí porque entró por la puerta pública antes de verificar).
    //    Así NO se pierde al mover la persona a su instancia.
    const [prev] = await tx<{ api_key_enc: string | null; api_key_hint: string | null }[]>`
      SELECT api_key_enc, api_key_hint FROM demo_users
      WHERE lower(email)=${correo} AND api_key_enc IS NOT NULL
      ORDER BY last_seen_at DESC LIMIT 1
    `;
    const keyEnc = prev?.api_key_enc ?? null;
    const keyHint = prev?.api_key_hint ?? null;

    // 1) Alta/actualización de la persona del dueño EN SU instancia, con su key
    //    rescatada. En UPDATE, solo pisa la key si la fila destino no tenía una.
    await tx`
      INSERT INTO demo_users (kind, instancia, name, email, status, rol, hilo_nombre, api_key_enc, api_key_hint, created_at, last_seen_at)
      VALUES (${instancia}, ${instancia}, ${nombre}, ${correo}, 'active', 'dueno', 'general', ${keyEnc}, ${keyHint}, ${seen}, ${seen})
      ON CONFLICT (kind, lower(email)) DO UPDATE
        SET status='active', rol='dueno', hilo_nombre='general', last_seen_at=${seen},
            api_key_enc = COALESCE(demo_users.api_key_enc, EXCLUDED.api_key_enc),
            api_key_hint = COALESCE(demo_users.api_key_hint, EXCLUDED.api_key_hint)
    `;
    // 2) Borrar su registro en 'general' (entró por la puerta pública antes de
    //    verificar). Su sitio es SU oficina. La key ya se rescató arriba.
    await tx`
      DELETE FROM demo_users
      WHERE instancia='general' AND lower(email)=${correo} AND ${instancia} <> 'general'
    `;
  });
}

export async function touch(
  kind: DemoKind,
  email: string,
  now: number,
): Promise<RegisterResult | null> {
  const sql = db();
  return sql.begin(async (tx) => {
    const t = tx as unknown as SqlLike;
    // Buscar la persona por CORREO en cualquier instancia (no atado al kind de la
    // cookie). Un dueño verificado vive en SU instancia (brian), no en el 'general'
    // de la cookie → si filtrábamos por kind, al refrescar no se encontraba y la UI
    // sacaba al usuario. Su instancia REAL manda para el estado/cupo.
    const [u] = await tx<{ id: string; instancia: string }[]>`
      SELECT id, instancia FROM demo_users WHERE lower(email) = ${email}
      ORDER BY last_seen_at DESC LIMIT 1
    `;
    if (!u) return null;
    const inst = u.instancia as DemoKind;
    const ctx: OpCtx = {}; // O-F3: memo para todo el latido
    await tx`UPDATE demo_users SET last_seen_at = ${new Date(now)} WHERE id = ${u.id}`;
    // O-F5 · El latido (cada 5 s por usuario) es el 90% del tráfico a Neon. El
    // MANTENIMIENTO (liberar sesiones muertas + promover cola) no necesita correr
    // en cada latido: basta con hacerlo cada MANTENIMIENTO_MS por instancia.
    // Efecto observable idéntico: una sesión muerta se libera igual (el TTL sigue
    // siendo el mismo), solo que se detecta en la siguiente pasada de mantenimiento.
    if (tocaMantenimiento(inst, now)) {
      await reapStale(t, inst, now);
      await promote(t, inst, ctx); // O-F2: sale barato si no hay cola
    }
    return buildResult(t, inst, email, true, ctx);
  });
}

export async function endSession(
  kind: DemoKind,
  email: string,
  now: number,
): Promise<string[]> {
  const sql = db();
  return sql.begin(async (tx) => {
    const t = tx as unknown as SqlLike;
    // Ubica por CORREO (su instancia real manda, no el kind de la cookie).
    await tx`UPDATE demo_users SET status='released' WHERE lower(email) = ${email}`;
    await reapStale(t, kind, now);
    return promote(t, kind);
  });
}

export async function markNotified(kind: DemoKind, email: string): Promise<void> {
  const sql = db();
  // Ubica por CORREO (su instancia real manda, no el kind de la cookie).
  await sql`UPDATE demo_users SET notified = true WHERE lower(email) = ${email}`;
}

// Guarda la API key CIFRADA en la INSTANCIA REAL del usuario (no en el kind de la
// cookie). Un dueño verificado vive en su instancia (brian) aunque la cookie diga
// 'general' → si filtrábamos por el kind de la cookie, el UPDATE no tocaba ninguna
// fila y la key se perdía. Ahora se ubica por correo y se guarda donde vive.
export async function saveApiKey(
  kind: DemoKind,
  email: string,
  encBlob: string,
  hint: string,
): Promise<void> {
  const sql = db();
  const res = await sql`
    UPDATE demo_users SET api_key_enc = ${encBlob}, api_key_hint = ${hint}
    WHERE lower(email) = ${email}
  `;
  // Si por algún caso no existiera la persona, no rompe (0 filas). El caller ya
  // validó la sesión; en la práctica siempre hay al menos una fila del correo.
  void res;
}

// Actualiza el NOMBRE del perfil (se refleja en BD). El correo es la identidad
// y no se cambia (cambiarlo sería otra sesión).
export async function updateName(
  kind: DemoKind,
  email: string,
  newName: string,
): Promise<void> {
  const sql = db();
  await sql`
    UPDATE demo_users SET name = ${newName}
    WHERE lower(email) = ${email}
  `;
}

// Enciende/apaga el agente (estado del contenedor Docker). Solo demos 1:1.
export async function setAgentState(
  kind: DemoKind,
  email: string,
  on: boolean,
): Promise<void> {
  const sql = db();
  await sql`
    UPDATE demo_users SET agent_on = ${on}
    WHERE lower(email) = ${email}
  `;
}

// --- Edición desde el panel admin (por id de fila) ---

// Edita nombre y/o correo de una persona (REAL, se guarda). El correo es la
// identidad: cambiarlo mueve la fila a otra identidad, así que se valida que no
// choque con otra persona del mismo demo real. name/email llegan normalizados.
// Devuelve 'ok' | 'email_en_uso' | 'no_existe'.
export async function editarUsuario(
  id: string,
  cambios: { name?: string; email?: string },
): Promise<"ok" | "email_en_uso" | "no_existe"> {
  const sql = db();
  return sql.begin(async (tx) => {
    const [u] = await tx<{ instancia: string }[]>`SELECT instancia FROM demo_users WHERE id = ${id}`;
    if (!u) return "no_existe" as const;

    // Si cambia el correo, que no colisione con otra persona de la misma instancia.
    if (cambios.email) {
      const [clash] = await tx<{ id: string }[]>`
        SELECT id FROM demo_users
        WHERE instancia = ${u.instancia} AND lower(email) = ${cambios.email} AND id <> ${id}
      `;
      if (clash) return "email_en_uso" as const;
    }

    // Actualiza solo los campos provistos.
    if (cambios.name !== undefined && cambios.email !== undefined) {
      await tx`UPDATE demo_users SET name = ${cambios.name}, email = ${cambios.email} WHERE id = ${id}`;
    } else if (cambios.name !== undefined) {
      await tx`UPDATE demo_users SET name = ${cambios.name} WHERE id = ${id}`;
    } else if (cambios.email !== undefined) {
      await tx`UPDATE demo_users SET email = ${cambios.email} WHERE id = ${id}`;
    }
    return "ok" as const;
  });
}

// Elimina una persona (por id de fila). Borra su registro de demo_users. Si es
// una 1:1 privada, también borra su "puerta" en demo_accounts (por correo), para
// no dejar el link huérfano. Devuelve 'ok' | 'no_existe'.
export async function eliminarUsuario(id: string): Promise<"ok" | "no_existe"> {
  const sql = db();
  return sql.begin(async (tx) => {
    const [u] = await tx<{ email: string }[]>`
      SELECT email FROM demo_users WHERE id = ${id}
    `;
    if (!u) return "no_existe" as const;
    await tx`DELETE FROM demo_users WHERE id = ${id}`;
    // Si tenía una demo 1:1 privada con ese correo, borra también la puerta.
    await tx`
      DELETE FROM demo_accounts
      WHERE kind = 'privado' AND lower(email_autorizado) = ${u.email.toLowerCase()}
    `;
    return "ok" as const;
  });
}

// MOCKUP de "cambiar demo": actualiza SOLO kind_ui (lo que se muestra en el
// panel). El demo REAL (kind) NO se toca → el hilo del agente NO se mueve. Neon
// guarda ambos, así sabe la verdad: en UI se ve una cosa, en realidad es otra.
// Migrar el hilo real entre agentes es un pendiente a futuro (no codificado aún).
export async function cambiarDemoMock(
  id: string,
  nuevoDemoUi: DemoKind,
): Promise<"ok" | "no_existe"> {
  const sql = db();
  const [u] = await sql<{ id: string }[]>`
    UPDATE demo_users SET kind_ui = ${nuevoDemoUi} WHERE id = ${id} RETURNING id
  `;
  return u ? "ok" : "no_existe";
}

// --- Lectura para el dashboard admin (todas las demos) ---
export async function listUsers(now: number): Promise<DemoUser[]> {
  const sql = db();
  // S4a · reap de todas las instancias ACTIVAS, leídas de demo_instancias.
  // Antes era la lista fija ["general","jazz","mashe","brian"]: una instancia nueva
  // creada con un INSERT nunca veía limpiadas sus sesiones muertas, así que su cupo
  // se quedaba ocupado por gente que ya se fue.
  for (const inst of await instanciasActivas()) {
    await reapStale(sql, inst.instancia, now);
  }
  const rows = await sql<
    {
      id: string;
      kind: string;
      kind_ui: string | null;
      name: string;
      email: string;
      status: string;
      position: number | null;
      notified: boolean;
      agent_on: boolean;
      created_at: Date;
      last_seen_at: Date;
    }[]
  >`
    SELECT id, kind, kind_ui, name, email, status, position, notified, agent_on, created_at, last_seen_at
    FROM demo_users ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as DemoKind,
    // kind_ui puede venir null en filas viejas → cae al real.
    kindUi: (r.kind_ui ?? r.kind) as DemoKind,
    name: r.name,
    email: r.email,
    status: r.status as DemoUser["status"],
    position: r.position,
    notified: r.notified,
    agentOn: r.agent_on,
    createdAt: r.created_at.getTime(),
    lastSeenAt: r.last_seen_at.getTime(),
  }));
}

export async function counts(now: number) {
  const sql = db();
  await reapStale(sql, "general", now);
  const [row] = await sql<
    { total: number; active: number; waiting: number }[]
  >`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE status='active')::int AS active,
      count(*) FILTER (WHERE status='waiting')::int AS waiting
    FROM demo_users
  `;
  // Cupo que muestra el panel: lo decide demo_config.panel_cupo_modo (NO el código).
  //   'suma'    → suma de todas las instancias activas (10+1+1+1 = 13)
  //   'general' → solo el cupo de general (10)
  // Cambiarlo = UPDATE en demo_config, sin push ni redeploy.
  // I5b · la suma sale de cupoTotalActivas() (lib/demo/instancias.ts), no de un
  // SELECT propio: antes esta rama consultaba demo_instancias por su cuenta, sin
  // cache y sin try/catch, así que con la BD caída tumbaba el panel entero —
  // mientras la rama 'general' sí degradaba. Ahora ambas ramas usan la misma
  // puerta a la BD y degradan igual.
  const modo = await panelCupoModo();
  const maxConcurrent =
    modo === "general" ? await cupoDe("general") : await cupoTotalActivas();
  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    waiting: row?.waiting ?? 0,
    maxConcurrent,
  };
}
