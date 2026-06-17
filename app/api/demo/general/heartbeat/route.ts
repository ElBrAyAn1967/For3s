// POST /api/demo/general/heartbeat — mantiene viva la sesión y reevalúa la cola.
// Identifica la demo (kind) y la persona (correo) por la cookie de sesión.

import { touch } from "@/lib/demo/userStore";
import { readDemoSession } from "@/lib/demo/session";
import type { DemoKind } from "@/lib/demo/types";

export async function POST() {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }
  const result = await touch(sess.kind as DemoKind, sess.email, Date.now());
  if (!result) {
    return Response.json({ error: "session_not_found" }, { status: 404 });
  }
  return Response.json(result);
}
