// Mapa correo → instancia dueña (Ronda F0 "enrutar correo del dueño → su instancia").
//
// Las instancias del server están AISLADAS: general no conoce el correo de brian.
// Por eso el mapa vive en Neon (el sitio lo controla), no en el server. Cuando
// alguien entra a la demo con su correo, el sitio consulta aquí:
//   - correo en demo_duenos → es dueño de esa instancia (brian/jazz/mashe)
//     → dispara verificación por código (Pieza 2) antes de enrutar (Pieza 3).
//   - correo NO está → demo General normal, sin fricción (flujo de hoy, intacto).
//
// Se llena desde el panel admin (como las 1:1). general NUNCA está aquí: es
// multi-tenant, no tiene un dueño único.

import { db } from "./db";

export interface DuenoInstancia {
  email: string;
  instancia: string;
  nombre: string | null;
}

// ¿Este correo es dueño de alguna instancia? Devuelve la instancia o null.
// El correo llega normalizado (minúsculas) — es la identidad.
export async function instanciaDe(email: string): Promise<DuenoInstancia | null> {
  const sql = db();
  const correo = email.trim().toLowerCase();
  const [row] = await sql<{ email: string; instancia: string; nombre: string | null }[]>`
    SELECT email, instancia, nombre FROM demo_duenos WHERE email = ${correo}
  `;
  return row ? { email: row.email, instancia: row.instancia, nombre: row.nombre } : null;
}

// Alta/actualización de un dueño (desde el panel admin). instancia = brian/jazz/mashe.
export async function registrarDueno(input: {
  email: string;
  instancia: string;
  nombre?: string;
}): Promise<void> {
  const sql = db();
  const correo = input.email.trim().toLowerCase();
  const nombre = input.nombre?.trim() || null;
  await sql`
    INSERT INTO demo_duenos (email, instancia, nombre)
    VALUES (${correo}, ${input.instancia}, ${nombre})
    ON CONFLICT (email) DO UPDATE
      SET instancia = EXCLUDED.instancia, nombre = EXCLUDED.nombre
  `;
}

// Lista los dueños registrados (para el panel).
export async function listarDuenos(): Promise<DuenoInstancia[]> {
  const sql = db();
  const rows = await sql<{ email: string; instancia: string; nombre: string | null }[]>`
    SELECT email, instancia, nombre FROM demo_duenos ORDER BY instancia, email
  `;
  return rows.map((r) => ({ email: r.email, instancia: r.instancia, nombre: r.nombre }));
}
