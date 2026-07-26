// POST /api/demo/general/heartbeat — mantiene viva la sesión y reevalúa la cola.
// Identifica la demo (kind) y la persona (correo) por la cookie de sesión.

import { touch } from "@/lib/demo/userStore";
import { requireSession } from "@/lib/demo/session";

export async function POST() {
  const { sess, error } = await requireSession();
  if (error) return error;
  const result = await touch(sess.kind, sess.email, Date.now());
  if (!result) {
    return Response.json({ error: "session_not_found" }, { status: 404 });
  }
  return Response.json(result);
}
