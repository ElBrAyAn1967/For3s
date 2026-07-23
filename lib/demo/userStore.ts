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
import {
  MAX_CONCURRENT,
  type RegisterResult,
  type RegisterDenied,
  type DemoUser,
  type DemoKind,
} from "./types";
import { db } from "./db";

const ACTIVE_TTL_MS = 60_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlLike = Sql<any>;

// Marca como 'released' las sesiones activas sin heartbeat reciente (de un kind).
async function reapStale(sql: SqlLike, kind: DemoKind, now: number): Promise<void> {
  const cutoff = new Date(now - ACTIVE_TTL_MS);
  await sql`
    UPDATE demo_users SET status = 'released'
    WHERE kind = ${kind} AND status = 'active' AND last_seen_at < ${cutoff}
  `;
}

async function activeCount(sql: SqlLike, kind: DemoKind): Promise<number> {
  const [row] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM demo_users WHERE kind = ${kind} AND status = 'active'
  `;
  return row?.n ?? 0;
}

// Promueve de la cola (FIFO) mientras haya cupo en ese kind. Recalcula posiciones.
// Devuelve los correos recién promovidos (para notificar — stub email).
async function promote(sql: SqlLike, kind: DemoKind): Promise<string[]> {
  const max = MAX_CONCURRENT[kind];
  const active = await activeCount(sql, kind);
  let free = max - active;
  const promoted: string[] = [];

  if (free > 0) {
    const waiting = await sql<{ id: string; email: string }[]>`
      SELECT id, email FROM demo_users WHERE kind = ${kind} AND status = 'waiting'
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
      FROM demo_users WHERE kind = ${kind} AND status = 'waiting'
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
    FROM demo_users WHERE kind = ${kind} AND lower(email) = ${email}
  `;
  const active = await activeCount(sql, kind);
  return {
    status: (u?.status ?? "released") as RegisterResult["status"],
    position: u?.position ?? null,
    returning,
    activeCount: active,
    maxConcurrent: MAX_CONCURRENT[kind],
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
    const max = MAX_CONCURRENT[kind];

    const [existing] = await tx<{ id: string; name: string }[]>`
      SELECT id, name FROM demo_users WHERE kind = ${kind} AND lower(email) = ${email}
    `;

    if (existing) {
      if (existing.name !== name) {
        return { error: "name_mismatch" } satisfies RegisterDenied;
      }
      await tx`
        UPDATE demo_users
        SET last_seen_at = ${seen},
            status = CASE
              WHEN status IN ('released','connecting') AND
                   (SELECT count(*) FROM demo_users WHERE kind = ${kind} AND status='active') < ${max}
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
    await tx`
      INSERT INTO demo_users (kind, name, email, status, created_at, last_seen_at)
      VALUES (${kind}, ${name}, ${email}, ${status}, ${seen}, ${seen})
    `;
    await promote(t, kind);
    return buildResult(t, kind, email, false);
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
    const [u] = await tx<{ id: string }[]>`
      SELECT id FROM demo_users WHERE kind = ${kind} AND lower(email) = ${email}
    `;
    if (!u) return null;
    await tx`UPDATE demo_users SET last_seen_at = ${new Date(now)} WHERE id = ${u.id}`;
    await reapStale(t, kind, now);
    await promote(t, kind);
    return buildResult(t, kind, email, true);
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
    await tx`UPDATE demo_users SET status='released' WHERE kind = ${kind} AND lower(email) = ${email}`;
    await reapStale(t, kind, now);
    return promote(t, kind);
  });
}

export async function markNotified(kind: DemoKind, email: string): Promise<void> {
  const sql = db();
  await sql`UPDATE demo_users SET notified = true WHERE kind = ${kind} AND lower(email) = ${email}`;
}

// Guarda la API key CIFRADA (ligada a kind+correo).
export async function saveApiKey(
  kind: DemoKind,
  email: string,
  encBlob: string,
  hint: string,
): Promise<void> {
  const sql = db();
  await sql`
    UPDATE demo_users SET api_key_enc = ${encBlob}, api_key_hint = ${hint}
    WHERE kind = ${kind} AND lower(email) = ${email}
  `;
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
    WHERE kind = ${kind} AND lower(email) = ${email}
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
    WHERE kind = ${kind} AND lower(email) = ${email}
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
    const [u] = await tx<{ kind: string }[]>`SELECT kind FROM demo_users WHERE id = ${id}`;
    if (!u) return "no_existe" as const;

    // Si cambia el correo, que no colisione con otra persona del mismo demo real.
    if (cambios.email) {
      const [clash] = await tx<{ id: string }[]>`
        SELECT id FROM demo_users
        WHERE kind = ${u.kind} AND lower(email) = ${cambios.email} AND id <> ${id}
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
  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    waiting: row?.waiting ?? 0,
    maxConcurrent: MAX_CONCURRENT.general,
  };
}
