// Store de CUENTAS de demo — respaldado por Postgres (tabla demo_accounts).
//
// Una "cuenta" es una demo configurada: la General (compartida) y las 1:1
// privadas que Brian da a una persona concreta. A diferencia de demo_users
// (las personas que entran a la demo General), aquí vive la CONFIGURACIÓN:
// qué demos existen, su token secreto, a quién se le dio y a qué instancia.
//
// Paso 2 (2026-07-22): antes las 1:1 vivían como variables de Vercel
// (DEMO_BRIAN_TOKEN, etc.), lo que no escala. Ahora se agregan desde el panel
// y se guardan aquí. El token 1:1 se genera en código, impredecible.
//
// Columnas de demo_accounts:
//   kind             'general' | 'privado' (+ legado jazz/mashe/brian)
//   token            secreto de la URL /demo/<token> (null en general)
//   max_concurrent   cupo (1 en 1:1, 10 en general)
//   container_name   contenedor Docker destino
//   nombre_persona   a quién se le dio esta demo 1:1
//   email_autorizado correo que puede entrar
//   instancia        a qué instancia For3s apunta

import { randomBytes } from "node:crypto";
import { db } from "./db";

// Instancias válidas a las que una demo 1:1 puede apuntar (lista fija,
// decisión de Brian 2026-07-22). Si mañana hay una instancia nueva de verdad,
// se agrega aquí.
export const INSTANCIAS = ["general", "jazz", "mashe", "foresito", "brian"] as const;
export type Instancia = (typeof INSTANCIAS)[number];

// Vista de una cuenta 1:1 para el panel admin (sin exponer el token completo
// salvo cuando se acaba de crear, que es cuando Brian necesita copiarlo).
export interface CuentaPrivada {
  kind: string;
  token: string | null;
  nombrePersona: string | null;
  emailAutorizado: string | null;
  instancia: string | null;
  maxConcurrent: number;
  containerName: string;
}

// Genera un token secreto impredecible para una demo 1:1, con el mismo estilo
// que los tokens que ya existían (prefijo 'p-' de privado + base64url). 24 bytes
// = 192 bits de entropía: imposible de adivinar.
export function generarToken(): string {
  return "p-" + randomBytes(24).toString("base64url");
}

// Lista las cuentas 1:1 (privadas + legado jazz/mashe/brian). NO incluye general.
export async function listAccounts(): Promise<CuentaPrivada[]> {
  const sql = db();
  const rows = await sql<
    {
      kind: string;
      token: string | null;
      nombre_persona: string | null;
      email_autorizado: string | null;
      instancia: string | null;
      max_concurrent: number;
      container_name: string;
    }[]
  >`
    SELECT kind, token, nombre_persona, email_autorizado, instancia,
           max_concurrent, container_name
    FROM demo_accounts
    WHERE kind <> 'general'
    ORDER BY kind
  `;
  return rows.map((r) => ({
    kind: r.kind,
    token: r.token,
    nombrePersona: r.nombre_persona,
    emailAutorizado: r.email_autorizado,
    instancia: r.instancia,
    maxConcurrent: r.max_concurrent,
    containerName: r.container_name,
  }));
}

// Resuelve una demo 1:1 privada por su token secreto (consulta Neon). Devuelve
// null si el token no existe → la página responde 404 (no revela tokens válidos).
// Solo busca cuentas 'privado' (las creadas desde el panel); las legado
// jazz/mashe/brian se resuelven aparte por env var en accounts.ts.
export async function resolvePrivadaByToken(token: string): Promise<CuentaPrivada | null> {
  const sql = db();
  const [r] = await sql<
    {
      kind: string;
      token: string | null;
      nombre_persona: string | null;
      email_autorizado: string | null;
      instancia: string | null;
      max_concurrent: number;
      container_name: string;
    }[]
  >`
    SELECT kind, token, nombre_persona, email_autorizado, instancia,
           max_concurrent, container_name
    FROM demo_accounts
    WHERE kind = 'privado' AND token = ${token}
    LIMIT 1
  `;
  if (!r) return null;
  return {
    kind: r.kind,
    token: r.token,
    nombrePersona: r.nombre_persona,
    emailAutorizado: r.email_autorizado,
    instancia: r.instancia,
    maxConcurrent: r.max_concurrent,
    containerName: r.container_name,
  };
}

// Agrega a mano una persona a la demo GENERAL (sin link: entra por /demo directo).
// Es un usuario normal de general, pre-cargado desde el panel. Idempotente:
// si el correo ya existe en general, no duplica. Devuelve si ya existía.
export async function crearGeneral(input: {
  nombre: string;
  email: string;
}): Promise<{ yaExistia: boolean }> {
  const sql = db();
  const email = input.email.trim().toLowerCase();
  const nombreNorm = input.nombre.trim().toLowerCase();
  const now = new Date();
  const [row] = await sql<{ inserted: boolean }[]>`
    INSERT INTO demo_users (kind, name, email, status, created_at, last_seen_at)
    VALUES ('general', ${nombreNorm}, ${email}, 'released', ${now}, ${now})
    ON CONFLICT (kind, lower(email)) DO NOTHING
    RETURNING true AS inserted
  `;
  return { yaExistia: !row };
}

// ¿Este correo es el autorizado de ALGUNA demo 1:1 privada? (consulta Neon).
// Lo usa el register para dejar entrar a una privada aunque corra sobre la
// instancia general (que de suyo no restringe correos). El correo llega ya
// normalizado a minúsculas.
export async function esCorreoDePrivada(email: string): Promise<boolean> {
  const sql = db();
  const [r] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM demo_accounts
    WHERE kind = 'privado' AND lower(email_autorizado) = ${email.trim().toLowerCase()}
  `;
  return (r?.n ?? 0) > 0;
}

// Crea una demo 1:1 privada. Escribe en DOS tablas (transaccional):
//   - demo_accounts: la "puerta" (token/link + correo autorizado + instancia).
//   - demo_users:    la PERSONA, como cualquier otro usuario, pero con su token.
//     (Brian 2026-07-22: "la 1:1 también es un usuario como los otros, con otras
//      características" → debe aparecer en la tabla de personas del panel.)
// La persona corre sobre la INSTANCIA elegida (decisión de Brian): su `kind` en
// demo_users es esa instancia, que ya es un runtime válido. Devuelve el token
// generado para armar el link /demo/<token>.
// El correo se guarda normalizado (minúsculas) — es la identidad autorizada.
export async function crearPrivada(input: {
  nombre: string;
  email: string;
  instancia: Instancia;
}): Promise<{ token: string }> {
  const sql = db();
  const token = generarToken();
  const email = input.email.trim().toLowerCase();
  const nombreVisible = input.nombre.trim();
  const nombreNorm = nombreVisible.toLowerCase(); // demo_users guarda name en minúsculas
  const container = `for3s-demo-${input.instancia}`;
  const now = new Date();

  return sql.begin(async (tx) => {
    // 1) La puerta: token + correo autorizado + a qué instancia apunta.
    await tx`
      INSERT INTO demo_accounts
        (kind, token, max_concurrent, container_name, nombre_persona, email_autorizado, instancia)
      VALUES
        ('privado', ${token}, 1, ${container}, ${nombreVisible}, ${email}, ${input.instancia})
    `;
    // 2) La persona: un usuario más, sobre la instancia elegida. 'released' hasta
    //    que entre por su link (entonces la máquina de estados la activa).
    await tx`
      INSERT INTO demo_users (kind, name, email, status, created_at, last_seen_at)
      VALUES (${input.instancia}, ${nombreNorm}, ${email}, 'released', ${now}, ${now})
      ON CONFLICT (kind, lower(email)) DO NOTHING
    `;
    return { token };
  });
}
