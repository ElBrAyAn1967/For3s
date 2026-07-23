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

// Crea una demo 1:1 privada. Genera el token, la inserta y devuelve el token
// generado (para armar el link /demo/<token> que Brian copia).
// El correo se guarda normalizado (minúsculas) — es la identidad autorizada.
export async function crearPrivada(input: {
  nombre: string;
  email: string;
  instancia: Instancia;
}): Promise<{ token: string }> {
  const sql = db();
  const token = generarToken();
  const email = input.email.trim().toLowerCase();
  const nombre = input.nombre.trim();
  // El contenedor de una 1:1 nueva va a la instancia elegida (Paso 3 conecta el
  // enrutado real; por ahora se guarda la referencia).
  const container = `for3s-demo-${input.instancia}`;
  await sql`
    INSERT INTO demo_accounts
      (kind, token, max_concurrent, container_name, nombre_persona, email_autorizado, instancia)
    VALUES
      ('privado', ${token}, 1, ${container}, ${nombre}, ${email}, ${input.instancia})
  `;
  return { token };
}
