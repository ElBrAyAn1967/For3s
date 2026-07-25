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
import { cupoDe } from "./instancias"; // C3: cupo desde demo_instancias
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

// Marca como 'released' las sesiones activas sin heartbeat reciente (de un kind).
// El TTL sale de demo_config.sesion_ttl_seg (editable sin push; default 60s).
async function reapStale(sql: SqlLike, kind: DemoKind, now: number): Promise<void> {
  const cutoff = new Date(now - (await sesionTtlMs()));
  await sql`
    UPDATE demo_users SET status = 'released'
    WHERE instancia = ${kind} AND status = 'active' AND last_seen_at < ${cutoff}
  `;
}

async function activeCount(sql: SqlLike, kind: DemoKind): Promise<number> {
  const [row] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM demo_users WHERE instancia = ${kind} AND status = 'active'
  `;
  return row?.n ?? 0;
}

// Promueve de la cola (FIFO) mientras haya cupo en ese kind. Recalcula posiciones.
// Devuelve los correos recién promovidos (para notificar — stub email).
async function promote(sql: SqlLike, kind: DemoKind): Promise<string[]> {
  const max = await cupoDe(kind); // C3: cupo desde demo_instancias (antes MAX_CONCURRENT[kind])
  const active = await activeCount(sql, kind);
  let free = max - active;
  const promoted: string[] = [];

  if (free > 0) {
    const waiting = await sql<{ id: string; email: string }[]>`
      SELECT id, email FROM demo_users WHERE instancia = ${kind} AND status = 'waiting'
      ORDER BY last_seen_at ASC LIMIT ${free}
    `;
    for (const w of waiting) {
      await sql`UPDATE demo_users SET status='active', position=NULL WHERE id=${w.id}`;
      promoted.push(w.email);
      free--;
    }
  }

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
): Promise<RegisterResult> {
  const [u] = await sql<
    {
      status: string;
      position: number | null;
      api_key_enc: string | null;
      api_key_hint: string | null;
      agent_on: boolean;
    }[]
  >`
    SELECT status, position, api_key_enc, api_key_hint, agent_on
    FROM demo_users WHERE instancia = ${kind} AND lower(email) = ${email}
  `;
  const active = await activeCount(sql, kind);
  return {
    status: (u?.status ?? "released") as RegisterResult["status"],
    position: u?.position ?? null,
    returning,
    activeCount: active,
    maxConcurrent: await cupoDe(kind), // C3: cupo desde demo_instancias
    hasApiKey: !!u?.api_key_enc,
    apiKeyHint: u?.api_key_hint ?? null,
    agentOn: u?.agent_on ?? true,
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
    await reapStale(t, kind, now);
    const seen = new Date(now);
    const max = await cupoDe(kind); // C3: cupo desde demo_instancias

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
      await promote(t, kind);
      return buildResult(t, kind, email, true);
    }

    const active = await activeCount(t, kind);
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
    await promote(t, kind);
    return buildResult(t, kind, email, false);
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
    await tx`UPDATE demo_users SET last_seen_at = ${new Date(now)} WHERE id = ${u.id}`;
    await reapStale(t, inst, now);
    await promote(t, inst);
    return buildResult(t, inst, email, true);
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
  // reap de todas las demos
  for (const k of ["general", "jazz", "mashe", "brian"] as DemoKind[]) {
    await reapStale(sql, k, now);
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
  const modo = await panelCupoModo();
  let maxConcurrent: number;
  if (modo === "general") {
    maxConcurrent = await cupoDe("general");
  } else {
    const [cap] = await sql<{ suma: number }[]>`
      SELECT COALESCE(sum(max_concurrent), 0)::int AS suma
      FROM demo_instancias WHERE activa = true
    `;
    maxConcurrent = cap?.suma ?? 0;
  }
  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    waiting: row?.waiting ?? 0,
    maxConcurrent,
  };
}
