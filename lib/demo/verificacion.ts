// Verificación por código de un dueño de instancia (Ronda F0 Pieza 2).
//
// Cuando un correo resulta ser dueño de una instancia (brian/jazz/mashe), NO se
// le da acceso directo: se le envía un código de 6 dígitos a su correo (Resend).
// Debe meterlo para probar que controla ese correo → recién ahí se enruta a su
// instancia (Pieza 3). general nunca pasa por aquí.
//
// Seguridad: el código se guarda HASHEADO (nunca en claro), un solo uso, y con
// tres frenos cuyos valores viven en demo_config (UPDATE sin push, defaults entre
// paréntesis): expiración `codigo_validez_min` (10 min) · intentos
// `codigo_max_intentos` (5, anti fuerza bruta) · reenvío `codigo_reenvio_seg`
// (60 s, para que pedir otro código no reinicie el contador de intentos).
// Un código nuevo reemplaza el anterior (PK por email).

import { createHash, randomInt } from "node:crypto";
import { Resend } from "resend";
import { db } from "./db";
import { normalizeEmail } from "./normalize";
import {
  codigoValidezMs,
  codigoValidezMin,
  codigoMaxIntentos,
  codigoReenvioSeg,
} from "./config";

// Validez e intentos salen de demo_config (codigo_validez_min / codigo_max_intentos)
// → se cambian con un UPDATE en Neon, sin push ni redeploy. Defaults: 10 min / 5.

// Hash del código (SHA-256 con el correo como sal → dos correos con el mismo
// código no colisionan). El código en claro nunca toca la BD.
// 🔴 BUG LATENTE CERRADO: esto normalizaba con `.toLowerCase()` a secas, mientras
// que la búsqueda usaba `.trim().toLowerCase()`. Un correo con espacios (" a@x.com")
// se GUARDABA con un hash y se BUSCABA con otro → el código correcto se rechazaba.
// No explotaba porque las rutas normalizan antes de llamar, pero cualquier llamador
// nuevo que no lo hiciera rompía la verificación en silencio. Ahora TODO el módulo
// normaliza por la misma puerta (normalizeEmail), así que no pueden divergir.
function hashCodigo(email: string, codigo: string): string {
  return createHash("sha256").update(`${normalizeEmail(email)}:${codigo}`).digest("hex");
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
  const email = normalizeEmail(input.email);
  const codigo = generarCodigo();
  const hash = hashCodigo(email, codigo);
  const expira = new Date(Date.now() + (await codigoValidezMs()));
  const sql = db();

  // 🔴 V2 · FRENO DE REENVÍO. El botón "reenviar código" de la UI llamaba a este
  // endpoint sin límite, y este INSERT hacía `intentos = 0` en el ON CONFLICT: es
  // decir, **reenviar RESETEABA el contador de intentos**, así que la defensa de
  // "máx 5 intentos" se burlaba pulsando reenviar entre tandas de prueba. Además
  // era un grifo de correos gratis (Resend) contra cualquier correo de dueño.
  //
  // Ahora: si ya hay un código VIGENTE y sin usar pedido hace menos de
  // demo_config.codigo_reenvio_seg (default 60s), no se emite otro.
  const [previo] = await sql<{ segundos: number; usado: boolean }[]>`
    SELECT EXTRACT(EPOCH FROM (now() - creado_at))::int AS segundos, usado
    FROM demo_verificaciones
    WHERE email = ${email} AND expira_at > now()
  `;
  const espera = await codigoReenvioSeg();
  if (previo && !previo.usado && previo.segundos < espera) {
    return { ok: false, error: "espera_para_reenviar" };
  }

  // 1) Guardar (reemplaza cualquier código previo de ese correo).
  // Los intentos vuelven a 0 SOLO porque el freno de arriba ya garantiza que esto
  // no se puede usar para limpiar el contador a voluntad.
  await sql`
    INSERT INTO demo_verificaciones (email, codigo_hash, instancia, expira_at, intentos, usado)
    VALUES (${email}, ${hash}, ${input.instancia}, ${expira}, 0, false)
    ON CONFLICT (email) DO UPDATE
      SET codigo_hash = EXCLUDED.codigo_hash, instancia = EXCLUDED.instancia,
          expira_at = EXCLUDED.expira_at, intentos = 0, usado = false, creado_at = now()
  `;

  // V3 · aprovechamos el envío para barrer códigos caducados (fire-and-forget:
  // no retrasa el correo, y si falla no rompe nada).
  void limpiarCodigosCaducados();

  // 2) Enviar por Resend. Si no hay API key configurada → error claro (no rompe).
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "correo_no_configurado" };
  const from = process.env.RESEND_FROM || "For3s <onboarding@resend.dev>";

  // V1 · los minutos que se anuncian salen de demo_config (igual que la expiración
  // real). Antes decía "10 minutos" fijo en el HTML: al cambiar
  // codigo_validez_min con un UPDATE, el correo mentía.
  const minutos = await codigoValidezMin();

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
          <p style="font-size:13px;color:#888">Válido ${minutos} ${minutos === 1 ? "minuto" : "minutos"}. Si no fuiste tú, ignora este correo.</p>
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
  const correo = normalizeEmail(email);
  const sql = db();

  return sql.begin(async (tx) => {
    const [row] = await tx<
      { codigo_hash: string; instancia: string; expira_at: Date; intentos: number; usado: boolean }[]
    >`SELECT codigo_hash, instancia, expira_at, intentos, usado
        FROM demo_verificaciones WHERE email = ${correo} FOR UPDATE`;

    if (!row || row.usado) return { ok: false as const, error: "no_hay_codigo" as const };
    if (row.expira_at.getTime() < Date.now()) return { ok: false as const, error: "expirado" as const };
    if (row.intentos >= (await codigoMaxIntentos())) return { ok: false as const, error: "bloqueado" as const };

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

/**
 * V3 · Borra códigos ya inservibles (caducados, o usados hace más de un día).
 * La tabla no se limpiaba nunca: una fila por correo que pidió código, para siempre.
 * Best-effort y barato (índice idx_verif_expira); se llama desde el envío, así que
 * no hace falta un cron. Nunca lanza: si falla, el flujo de verificación sigue.
 */
export async function limpiarCodigosCaducados(): Promise<number> {
  try {
    const sql = db();
    const filas = await sql<{ email: string }[]>`
      DELETE FROM demo_verificaciones
      WHERE expira_at < now() - interval '1 day'
         OR (usado = true AND creado_at < now() - interval '1 day')
      RETURNING email
    `;
    return filas.length;
  } catch {
    return 0; // la limpieza NUNCA debe romper la verificación
  }
}
