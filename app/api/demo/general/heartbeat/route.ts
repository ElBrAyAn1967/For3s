// POST /api/demo/general/heartbeat — mantiene viva la sesión y reevalúa la cola.
// Identifica la demo (kind) y la persona (correo) por la cookie de sesión.

import { touch } from "@/lib/demo/userStore";
import { requireSession } from "@/lib/demo/session";

export async function POST() {
  const { sess, error } = await requireSession();
  if (error) return error;

  // U1 · Un parpadeo de Neon NO debe expulsar a nadie. Hay que distinguir dos casos
  // que antes se confundían:
  //   · touch() → null   = la persona NO existe        → 404, la UI cierra sesión (correcto).
  //   · touch() lanza    = la BD falló un instante     → 503, la UI reintenta al siguiente
  //     latido (5s). Antes esto subía como 500 y el usuario se veía expulsado por un
  //     hipo de red, perdiendo su sesión aunque su fila siguiera intacta.
  let result;
  try {
    result = await touch(sess.kind, sess.email, Date.now());
  } catch (e) {
    console.warn(`[heartbeat] BD no responde para ${sess.email}: ${(e as Error).message}`);
    return Response.json({ error: "bd_no_disponible", reintentar: true }, { status: 503 });
  }
  if (!result) {
    return Response.json({ error: "session_not_found" }, { status: 404 });
  }
  return Response.json(result);
}
