// POST /api/demo/general/logout — cierra la sesión (botón o cierre de pestaña).
// Libera el cupo de su demo (kind) y promueve la cola, notificando (stub email).
// El registro persiste: puede volver con su nombre+correo.

import { endSession, listUsers } from "@/lib/demo/userStore";
import { readDemoSession, clearDemoEmail } from "@/lib/demo/session";
import { notifySpotAvailable } from "@/lib/demo/email";
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
  }
  return Response.json({ ok: true });
}
