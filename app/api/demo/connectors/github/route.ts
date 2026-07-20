// GET  /api/demo/connectors/github → ¿el usuario tiene GitHub conectado? {connected}
// DELETE /api/demo/connectors/github → desconectar (borra su token del vault).
// (Pieza C) El estado y la desconexión son POR USUARIO (correo de la sesión).

import { readDemoSession } from "@/lib/demo/session";
import { estadoConector, borrarConector } from "@/lib/demo/for3sChat";

export async function GET() {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }
  const connected = await estadoConector(sess.email, "github");
  return Response.json({ connected });
}

export async function DELETE() {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }
  const ok = await borrarConector(sess.email, "github");
  return Response.json({ ok, connected: false });
}
