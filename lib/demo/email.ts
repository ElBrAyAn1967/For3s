// Aviso por correo: "se liberó un lugar, ya puedes entrar".
//
// P6 · Antes esto era un STUB: solo imprimía en consola y marcaba al usuario como
// notificado, así que quien esperaba en la cola NUNCA se enteraba de que le tocaba
// su turno. Ahora manda el correo de verdad con Resend (el mismo proveedor y patrón
// que ya usa la verificación por código, lib/demo/verificacion.ts).
//
// Principio: notificar NO debe romper el flujo. Esto se llama desde el logout de
// OTRO usuario (el que liberó el cupo); si el correo falla, esa persona no tiene
// por qué ver un error. Por eso nunca lanza: registra el fallo y sigue. Al usuario
// se le marca como notificado igual (evita reintentar en bucle en cada promoción).

import { Resend } from "resend";
import { markNotified } from "./userStore";
import type { DemoKind } from "./types";

/** URL de la demo para el botón del correo (sin barra final). */
function urlDemo(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://for3s.vercel.app";
  return `${base}/demo`;
}

export async function notifySpotAvailable(
  kind: DemoKind,
  email: string,
  name: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "For3s <onboarding@resend.dev>";
  const nombre = (name || "").trim();

  if (!apiKey) {
    // Sin Resend configurado: no rompe, deja rastro y marca como notificado
    // (si no, se reintentaría en cada promoción).
    console.warn(`[demo-email] sin RESEND_API_KEY; no se avisó a ${email}`);
    await markNotified(kind, email);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Tu lugar en For3s está listo",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto">
          <p style="font-size:15px;color:#333">Hola${nombre ? " " + nombre : ""},</p>
          <p style="font-size:15px;color:#333">Se liberó un lugar y <strong>ya puedes
            entrar</strong> a la demo de For3s.</p>
          <p style="margin:24px 0">
            <a href="${urlDemo()}"
               style="background:#1a3d2e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;display:inline-block">
              Entrar a la demo
            </a>
          </p>
          <p style="font-size:13px;color:#888">Entra con el mismo nombre y correo con
            los que te registraste. Si tardas, el lugar puede pasar a la siguiente
            persona de la fila.</p>
        </div>`,
    });
    if (error) {
      console.warn(`[demo-email] Resend rechazó el aviso a ${email}: ${error.message}`);
    }
  } catch (e) {
    // Nunca propagar: el logout de otro usuario no debe fallar por un correo.
    console.warn(`[demo-email] fallo al avisar a ${email}: ${(e as Error).message}`);
  }

  await markNotified(kind, email);
}
