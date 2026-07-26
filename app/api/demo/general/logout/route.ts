// POST /api/demo/general/logout — cierra la sesión (botón o cierre de pestaña).
// Libera el cupo de su demo (kind) y promueve la cola, notificando (stub email).
// El registro persiste: puede volver con su nombre+correo.

import { endSession, listUsers } from "@/lib/demo/userStore";
import {
  readDemoSession,
  clearDemoEmail,
  clearDuenoVerificado,
} from "@/lib/demo/session";
import { notifySpotAvailable } from "@/lib/demo/email";
import { registrarEvento } from "@/lib/demo/eventos";
import type { DemoKind } from "@/lib/demo/types";

export async function POST() {
  const sess = await readDemoSession();
  if (sess) {
    const kind = sess.kind as DemoKind;
    const now = Date.now();
    const promoted = await endSession(kind, sess.email, now);
    const all = await listUsers(now);
    for (const promotedEmail of promoted) {
      const u = all.find((x) => x.email === promotedEmail && x.kind === kind);
      if (u) await notifySpotAvailable(kind, u.email, u.name);
    }
    await clearDemoEmail();
    // BUG hallado en P5: solo se limpiaba la cookie de correo, NO la de dueño
    // verificado → tras "Cerrar sesión" el navegador seguía marcado como dueño y
    // podía volver a entrar a esa instancia SIN pedir código otra vez.
    await clearDuenoVerificado();
    // C5 · Telemetría: la salida es un momento del flujo y NO se registraba (el tipo
    // 'logout' existía sin usarse), así que en demo_eventos las sesiones nunca cerraban.
    void registrarEvento({
      tipo: "logout",
      instancia: kind,
      email: sess.email,
      detalle: { promovidos: promoted.length },
    });
  }
  return Response.json({ ok: true });
}
