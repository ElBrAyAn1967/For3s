// Verificación por código de un dueño de instancia (Ronda F0 Pieza 2).
//
// Cuando un correo resulta ser dueño de una instancia (brian/jazz/mashe), NO se
// le da acceso directo: se le envía un código de 6 dígitos a su correo (Resend).
// Debe meterlo para probar que controla ese correo → recién ahí se enruta a su
// instancia (Pieza 3). general nunca pasa por aquí.
//
// Seguridad: el código se guarda HASHEADO (nunca en claro), expira en 10 min,
// máx 5 intentos (anti fuerza bruta), un solo uso. Un código nuevo reemplaza el
// anterior (PK por email).

import { createHash, randomInt } from "node:crypto";
import { Resend } from "resend";
import { db } from "./db";

const VALIDEZ_MS = 10 * 60 * 1000; // 10 minutos
const MAX_INTENTOS = 5;

// Hash del código (SHA-256 con el correo como sal → dos correos con el mismo
// código no colisionan). El código en claro nunca toca la BD.
function hashCodigo(email: string, codigo: string): string {
  return createHash("sha256").update(`${email.toLowerCase()}:${codigo}`).digest("hex");
}

// Genera un código de 6 dígitos criptográficamente aleatorio (randomInt, no Math.random).
function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// Crea (o reemplaza) el código de verificación y lo envía por correo.
// Devuelve { ok } o { ok:false, error }. NUNCA devuelve el código al cliente.
export async function enviarCodigo(input: {
  email: string;
  instancia: string;
  nombre?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const codigo = generarCodigo();
  const hash = hashCodigo(email, codigo);
  const expira = new Date(Date.now() + VALIDEZ_MS);

  // 1) Guardar (reemplaza cualquier código previo de ese correo → intentos a 0).
  const sql = db();
  await sql`
    INSERT INTO demo_verificaciones (email, codigo_hash, instancia, expira_at, intentos, usado)
    VALUES (${email}, ${hash}, ${input.instancia}, ${expira}, 0, false)
    ON CONFLICT (email) DO UPDATE
      SET codigo_hash = EXCLUDED.codigo_hash, instancia = EXCLUDED.instancia,
          expira_at = EXCLUDED.expira_at, intentos = 0, usado = false, creado_at = now()
  `;

  // 2) Enviar por Resend. Si no hay API key configurada → error claro (no rompe).
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "correo_no_configurado" };
  const from = process.env.RESEND_FROM || "For3s <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Tu código For3s: ${codigo}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto">
          <p style="font-size:15px;color:#333">Hola${input.nombre ? " " + input.nombre : ""},</p>
          <p style="font-size:15px;color:#333">Tu código para entrar a tu instancia
            <strong>${input.instancia}</strong> en For3s:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#111;margin:20px 0">${codigo}</p>
          <p style="font-size:13px;color:#888">Válido 10 minutos. Si no fuiste tú, ignora este correo.</p>
        </div>`,
    });
    if (error) return { ok: false, error: "envio_fallo" };
    return { ok: true };
  } catch {
    return { ok: false, error: "envio_fallo" };
  }
}

// Valida el código que metió el usuario. Devuelve la instancia si es correcto,
// o un error tipado. Consume el código (un solo uso) al acertar.
export async function validarCodigo(
  email: string,
  codigo: string,
): Promise<
  | { ok: true; instancia: string }
  | { ok: false; error: "no_hay_codigo" | "expirado" | "bloqueado" | "incorrecto" }
> {
  const correo = email.trim().toLowerCase();
  const sql = db();

  return sql.begin(async (tx) => {
    const [row] = await tx<
      { codigo_hash: string; instancia: string; expira_at: Date; intentos: number; usado: boolean }[]
    >`SELECT codigo_hash, instancia, expira_at, intentos, usado
        FROM demo_verificaciones WHERE email = ${correo} FOR UPDATE`;

    if (!row || row.usado) return { ok: false as const, error: "no_hay_codigo" as const };
    if (row.expira_at.getTime() < Date.now()) return { ok: false as const, error: "expirado" as const };
    if (row.intentos >= MAX_INTENTOS) return { ok: false as const, error: "bloqueado" as const };

    const acierto = row.codigo_hash === hashCodigo(correo, codigo.trim());
    if (!acierto) {
      await tx`UPDATE demo_verificaciones SET intentos = intentos + 1 WHERE email = ${correo}`;
      return { ok: false as const, error: "incorrecto" as const };
    }

    // Correcto: marcar usado (un solo uso) y devolver la instancia.
    await tx`UPDATE demo_verificaciones SET usado = true WHERE email = ${correo}`;
    return { ok: true as const, instancia: row.instancia };
  });
}
