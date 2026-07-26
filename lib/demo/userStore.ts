// Store de personas de las demos — respaldado por Postgres (Neon).
//
// Identidad por (instancia, correo normalizado). El cupo de cada instancia sale de
// demo_instancias (1:M general = 10 con lista de espera · 1:1 = 1).
// Sesión persistente: volver con el mismo nombre+correo continúa donde se quedó.
//
// Toda la lógica de capacidad/cola vive en SQL, SIEMPRE filtrada por instancia
// (las sesiones de una no afectan el cupo de otra).
//
// ── U3 · POR QUÉ EL PARÁMETRO SE LLAMA `instancia` Y NO `kind` ───────────────
// 12 funciones recibían un parámetro `kind` que en realidad ERA la instancia:
// `reapStale(sql, kind)` consultaba `WHERE instancia = ${kind}`. El nombre decía
// una cosa y el uso otra, y esa ambigüedad es la raíz del patrón "cookie kind ≠
// instancia real" que ya obligó a un barrido completo (b61e3d0), produjo el bug de
// telemetría (eventos con user_id NULL) y los de "la key acabó en el agente
// equivocado". Mientras el parámetro se llamara `kind`, el patrón reaparecía.
//
// ── U4 · LA IDENTIDAD YA NO DEPENDE DE `kind` ───────────────────────────────
// La tabla tenía DOS columnas con el mismo valor: `kind` (legado) e `instancia` (la
// buena, con FK a demo_instancias). El código escribía las dos y el índice único de
// identidad era sobre la VIEJA — por eso C6p2 ("borrar kind") llevaba bloqueado.
// Migración `db/demo/0002_u4_indice_instancia.sql`:
//   · índice único nuevo sobre (instancia, lower(email)); el viejo, retirado.
//   · el código ya NO escribe `kind` en los INSERT.
//   · un TRIGGER la mantiene en espejo de `instancia` mientras la columna exista:
//     es NOT NULL con default 'general', así que sin él las filas nuevas habrían
//     quedado con kind='general' aunque la instancia fuera otra (divergencia
//     silenciosa — justo lo que esta ronda evita).
// ⚠️ La columna NO se borró: `listUsers` todavía la SELECTa. El DROP COLUMN va en
// una migración posterior, cuando lleve tiempo sin escribirse.
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

// ── U2 · CAPA BASE ───────────────────────────────────────────────────────────
// Antes había 16 `const sql = db()` repartidos: cada función abría su propio acceso
// y escribía su propio SQL, así que "cómo se habla con demo_users" lo sabían 22
// funciones por separado en vez de un solo sitio. Es la misma plomería repetida que
// `llamarAgente()` eliminó en for3sChat.ts (−79%).
//
// Estas dos funciones son ese sitio único para el caso más repetido: "toca la fila de
// esta PERSONA". Las transacciones (registro, promoción, latido) siguen abriendo su
// `sql.begin` — ahí el acceso directo es correcto y no se toca.

/**
 * Actualiza campos de la persona identificada por CORREO y devuelve cuántas filas
 * cambiaron. UNA puerta para los UPDATE simples.
 *
 * ⭐ Por CORREO, nunca por instancia: un dueño verificado vive en SU instancia
 * (brian) aunque la cookie diga 'general'. Filtrar por la instancia de la cookie
 * hacía que el UPDATE no tocara ninguna fila y la key/el nombre se perdieran en
 * silencio — el bug d5dc778/b61e3d0. Esta puerta hace imposible repetirlo.
 */
async function actualizarPersona(
  email: string,
  campos: Record<string, unknown>,
): Promise<number> {
  const correo = email.trim().toLowerCase();
  const sql = db();
  // sql(objeto) genera el "SET col = valor, ..." de forma segura (parametrizado).
  const filas = await sql`
    UPDATE demo_users SET ${sql(campos)} WHERE lower(email) = ${correo}
  `;
  return filas.count ?? 0;
}

/** Cupo de la instancia, memoizado en el contexto de la operación. */
async function cupoDeCtx(instancia: DemoKind, ctx?: OpCtx): Promise<number> {
  if (ctx?.cupo !== undefined) return ctx.cupo;
  const v = await cupoDe(instancia);
  if (ctx) ctx.cupo = v;
  return v;
}

// Marca como 'released' las sesiones activas sin heartbeat reciente (de un kind).
// El TTL sale de demo_config.sesion_ttl_seg (editable sin push; default 60s).
async function reapStale(sql: SqlLike, instancia: DemoKind, now: number): Promise<void> {
  const cutoff = new Date(now - (await sesionTtlMs()));
  await sql`
    UPDATE demo_users SET status = 'released'
    WHERE instancia = ${instancia} AND status = 'active' AND last_seen_at < ${cutoff}
  `;
}

// O-F3 · memoizado por operación: el mismo conteo se pedía hasta 3 veces.
async function activeCount(
  sql: SqlLike,
  instancia: DemoKind,
  ctx?: OpCtx,
): Promise<number> {
  if (ctx?.activos !== undefined) return ctx.activos;
  const [row] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM demo_users WHERE instancia = ${instancia} AND status = 'active'
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
  instancia: DemoKind,
  ctx?: OpCtx,
): Promise<string[]> {
  // ¿Hay alguien en cola? Una consulta barata que evita TODO el resto si no.
  const [espera] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM demo_users
    WHERE instancia = ${instancia} AND status = 'waiting'
  `;
  if ((espera?.n ?? 0) === 0) return []; // O-F2: nada que promover ni renumerar

  const max = await cupoDeCtx(instancia, ctx); // O-F3: memoizado por operación
  const active = await activeCount(sql, instancia, ctx);
  const free = max - active;

  let promoted: string[] = [];
  if (free > 0) {
    // O-F1: un solo UPDATE para todos los que caben (CTE con el orden FIFO).
    const filas = await sql<{ email: string }[]>`
      WITH elegidos AS (
        SELECT id FROM demo_users
        WHERE instancia = ${instancia} AND status = 'waiting'
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
      FROM demo_users WHERE instancia = ${instancia} AND status = 'waiting'
    )
    UPDATE demo_users u SET position = o.rn FROM ordered o WHERE u.id = o.id
  `;
  return promoted;
}

async function buildResult(
  sql: SqlLike,
  instancia: DemoKind,
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
             WHERE instancia = ${instancia} AND status = 'active') AS activos
    FROM demo_users WHERE instancia = ${instancia} AND lower(email) = ${email}
  `;
  // Si la persona no existe en esta instancia, el count viene sin fila → se pide aparte.
  const active =
    u?.activos ?? ctx?.activos ?? (await activeCount(sql, instancia, ctx));
  if (ctx && u?.activos !== undefined) ctx.activos = u.activos; // alimenta el memo
  return {
    status: (u?.status ?? "released") as RegisterResult["status"],
    position: u?.position ?? null,
    returning,
    activeCount: active,
    maxConcurrent: await cupoDeCtx(instancia, ctx), // O-F3: memoizado
    hasApiKey: !!u?.api_key_enc,
    apiKeyHint: u?.api_key_hint ?? null,
    agentOn: u?.agent_on ?? true,
    // S4a · "es de pago" = la instancia es 1:1, según demo_instancias. Va como DATO
    // al cliente para que la UI no tenga que deducirlo del nombre. getInstancia
    // está cacheada (10s), así que no añade viaje a Neon en la práctica.
    esPago: (await getInstancia(instancia))?.modo === "1:1",
  };
}

// `name`/`email` ya normalizados (minúsculas). Reglas de identidad:
//  - Acceso = nombre + correo. Para CONTINUAR, AMBOS deben coincidir.
//  - Correo existe (en este kind) + nombre distinto → 'name_mismatch'.
//  - Correo no existe → registro nuevo (vincula nombre↔correo).
export async function registerOrResume(
  instancia: DemoKind,
  name: string,
  email: string,
  now: number,
): Promise<RegisterResult | RegisterDenied> {
  const sql = db();
  return sql.begin(async (tx) => {
    const t = tx as unknown as SqlLike;
    const ctx: OpCtx = {}; // O-F3: memo de cupo/activos para TODA esta operación
    await reapStale(t, instancia, now);
    const seen = new Date(now);
    const max = await cupoDeCtx(instancia, ctx); // O-F3: memoizado

    const [existing] = await tx<{ id: string; name: string }[]>`
      SELECT id, name FROM demo_users WHERE instancia = ${instancia} AND lower(email) = ${email}
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
        WHERE lower(email)=${email} AND instancia=${instancia}
      `;
      const rolAhora = (d?.n ?? 0) > 0 ? "dueno" : "visitante";
      await tx`
        UPDATE demo_users
        SET rol = ${rolAhora},
            hilo_nombre = ${nombreDeHilo(rolAhora, name, email)},
            last_seen_at = ${seen},
            status = CASE
              WHEN status IN ('released','connecting') AND
                   (SELECT count(*) FROM demo_users WHERE instancia = ${instancia} AND status='active') < ${max}
                THEN 'active'
              WHEN status IN ('released','connecting')
                THEN 'waiting'
              ELSE status
            END
        WHERE id = ${existing.id}
      `;
      await promote(t, instancia, ctx);
      return buildResult(t, instancia, email, true, ctx);
    }

    const active = await activeCount(t, instancia, ctx);
    const status = active < max ? "active" : "waiting";
    // C2 · doble-escritura (transición): escribe kind (viejo) E instancia/rol/
    // hilo_nombre (nuevo) a la vez. rol = 'dueno' si el correo está en demo_duenos
    // para esta instancia, si no 'visitante'. hilo = 'general' (dueño) | 'hilo-<nombre>'.
    // Derivado en SQL para que sea atómico y no cambie la firma de la función.
    const esDueno = await tx<{ n: number }[]>`
      SELECT count(*)::int AS n FROM demo_duenos
      WHERE lower(email)=${email} AND instancia=${instancia}
    `;
    const rol = (esDueno[0]?.n ?? 0) > 0 ? "dueno" : "visitante";
    // HALLAZGO 3 · nombre de hilo por el estándar único (lib/demo/hilos.ts):
    // dueño → 'general'; invitado → hilo-<nombre>-<sufijo del correo>, ÚNICO por
    // correo (antes solo el nombre → dos personas homónimas compartían hilo).
    const hilo = nombreDeHilo(rol, name, email);
    await tx`
      INSERT INTO demo_users (instancia, name, email, status, rol, hilo_nombre, created_at, last_seen_at)
      VALUES (${instancia}, ${name}, ${email}, ${status}, ${rol}, ${hilo}, ${seen}, ${seen})
    `;
    ctx.activos = undefined; // se insertó una fila → invalidar memo
    await promote(t, instancia, ctx);
    return buildResult(t, instancia, email, false, ctx);
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
/**
 * U1/U2 · LA consulta "¿quién es este correo?" — antes escrita 3 veces idéntica
 * (instanciaRealDe, hiloDe, nombreDe): mismo WHERE, mismo ORDER BY, distinta columna.
 * Ahora una sola, y los tres getters leen de su resultado.
 *
 * U1 · Degrada: si Neon no responde devuelve null en vez de LANZAR. Estos tres
 * getters los llama el chat (for3sChat) y verify/check; que un parpadeo de la BD
 * tumbe la conversación es peor que responder "no sé quién es".
 */
async function personaPorCorreo(email: string): Promise<{
  instancia: string;
  hilo_nombre: string | null;
  name: string;
} | null> {
  try {
    const sql = db();
    const [u] = await sql<
      { instancia: string; hilo_nombre: string | null; name: string }[]
    >`
      SELECT instancia, hilo_nombre, name FROM demo_users
      WHERE lower(email) = ${email.trim().toLowerCase()}
      ORDER BY last_seen_at DESC LIMIT 1
    `;
    return u ?? null;
  } catch (e) {
    console.warn(`[userStore] BD no responde al buscar '${email}': ${(e as Error).message}`);
    return null;
  }
}

export async function instanciaRealDe(email: string): Promise<string | null> {
  return (await personaPorCorreo(email))?.instancia ?? null;
}

/**
 * Hilo (tema) donde conversa esta persona en su agente. Es el nombre que el sitio
 * manda EXPLÍCITAMENTE al canal API: dueño → 'general' (su memoria de siempre);
 * invitado/visitante → 'hilo-<nombre>-<sufijo>' (aislado, ver lib/demo/hilos.ts).
 * Devuelve null si la persona no existe → el caller NO debe inventar un tema.
 */
export async function hiloDe(email: string): Promise<string | null> {
  return (await personaPorCorreo(email))?.hilo_nombre ?? null;
}

/** Nombre registrado de un correo (busca su fila más reciente en cualquier instancia). */
export async function nombreDe(email: string): Promise<string | null> {
  return (await personaPorCorreo(email))?.name ?? null;
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
      INSERT INTO demo_users (instancia, name, email, status, rol, hilo_nombre, api_key_enc, api_key_hint, created_at, last_seen_at)
      VALUES (${instancia}, ${nombre}, ${correo}, 'active', 'dueno', 'general', ${keyEnc}, ${keyHint}, ${seen}, ${seen})
      ON CONFLICT (instancia, lower(email)) DO UPDATE
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
  instancia: DemoKind,
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
  instancia: DemoKind,
  email: string,
  now: number,
): Promise<string[]> {
  const sql = db();
  return sql.begin(async (tx) => {
    const t = tx as unknown as SqlLike;
    // Ubica por CORREO (su instancia real manda, no el kind de la cookie).
    await tx`UPDATE demo_users SET status='released' WHERE lower(email) = ${email}`;
    await reapStale(t, instancia, now);
    return promote(t, instancia);
  });
}

export async function markNotified(instancia: DemoKind, email: string): Promise<void> {
  void instancia; // se ubica por CORREO; la instancia queda por compatibilidad de firma
  await actualizarPersona(email, { notified: true });
}

// Guarda la API key CIFRADA en la INSTANCIA REAL del usuario (no en el kind de la
// cookie). Un dueño verificado vive en su instancia (brian) aunque la cookie diga
// 'general' → si filtrábamos por el kind de la cookie, el UPDATE no tocaba ninguna
// fila y la key se perdía. Ahora se ubica por correo y se guarda donde vive.
export async function saveApiKey(
  instancia: DemoKind,
  email: string,
  encBlob: string,
  hint: string,
): Promise<void> {
  void instancia; // se ubica por CORREO (ver actualizarPersona)
  // Si no existiera la persona, no rompe (0 filas). El caller ya validó la sesión.
  await actualizarPersona(email, { api_key_enc: encBlob, api_key_hint: hint });
}

// Actualiza el NOMBRE del perfil (se refleja en BD). El correo es la identidad
// y no se cambia (cambiarlo sería otra sesión).
export async function updateName(
  instancia: DemoKind,
  email: string,
  newName: string,
): Promise<void> {
  void instancia; // se ubica por CORREO (ver actualizarPersona)
  await actualizarPersona(email, { name: newName });
}

// Enciende/apaga el agente (estado del contenedor Docker). Solo demos 1:1.
export async function setAgentState(
  instancia: DemoKind,
  email: string,
  on: boolean,
): Promise<void> {
  void instancia; // se ubica por CORREO (ver actualizarPersona)
  await actualizarPersona(email, { agent_on: on });
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

    // U2 · Actualiza solo los campos provistos. Antes eran tres ramas if/else con el
    // mismo UPDATE escrito de tres formas (name, email, ambos): agregar un cuarto
    // campo editable habría exigido siete ramas. Ahora se arma el SET desde el objeto.
    const set: Record<string, unknown> = {};
    if (cambios.name !== undefined) set.name = cambios.name;
    if (cambios.email !== undefined) set.email = cambios.email;
    if (Object.keys(set).length) {
      await tx`UPDATE demo_users SET ${tx(set)} WHERE id = ${id}`;
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
// U1 · Degrada a lista vacía si la BD no responde: el panel muestra "sin datos" en
// vez de reventar con un 500. También la usa logout (para notificar promovidos), y
// ahí un fallo de lectura NO debe impedir que alguien cierre sesión.
export async function listUsers(now: number): Promise<DemoUser[]> {
  try {
    return await listUsersInterno(now);
  } catch (e) {
    console.warn(`[userStore] listUsers degrada (BD): ${(e as Error).message}`);
    return [];
  }
}

async function listUsersInterno(now: number): Promise<DemoUser[]> {
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

// U1 · Degrada a ceros si la BD no responde (el panel dibuja "0 de N" en vez de
// romperse). `cupoTotalActivas`/`cupoDe` ya degradan por su cuenta (I5b).
export async function counts(now: number) {
  let row: { total: number; active: number; waiting: number } | undefined;
  try {
    const sql = db();
    await reapStale(sql, "general", now);
    [row] = await sql<{ total: number; active: number; waiting: number }[]>`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE status='active')::int AS active,
        count(*) FILTER (WHERE status='waiting')::int AS waiting
      FROM demo_users
    `;
  } catch (e) {
    console.warn(`[userStore] counts degrada (BD): ${(e as Error).message}`);
  }
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
