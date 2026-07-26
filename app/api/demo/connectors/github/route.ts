// GET  /api/demo/connectors/github → ¿el usuario tiene GitHub conectado? {connected}
// DELETE /api/demo/connectors/github → desconectar (borra su token del vault).
// (Pieza C) El estado y la desconexión son POR USUARIO (correo de la sesión).

import { requireSession } from "@/lib/demo/session";
import { estadoConector, borrarConector } from "@/lib/demo/for3sChat";

export async function GET() {
  const { sess, error } = await requireSession();
  if (error) return error;
  const connected = await estadoConector(sess.email, "github");
  return Response.json({ connected });
}

export async function DELETE() {
  const { sess, error } = await requireSession();
  if (error) return error;
  const ok = await borrarConector(sess.email, "github");
  return Response.json({ ok, connected: false });
}
