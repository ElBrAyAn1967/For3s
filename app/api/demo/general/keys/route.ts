// GET    /api/demo/general/keys → lista las keys f3k_ del usuario (sin la plana)
// POST   /api/demo/general/keys {nombre} → genera una (tope 3) → devuelve la plana 1 vez
// DELETE /api/demo/general/keys {id} → revoca la suya
// (Pieza D) API keys self-service. Identidad = correo de la SESIÓN (no del body).

import type { NextRequest } from "next/server";
import { readDemoSession } from "@/lib/demo/session";
import { listarMisKeys, generarMiKey, revocarMiKey } from "@/lib/demo/for3sChat";

export async function GET() {
  const sess = await readDemoSession();
  if (!sess) return Response.json({ error: "no_session" }, { status: 401 });
  const data = await listarMisKeys(sess.email);
  if (data === null) {
    return Response.json({ error: "no llego al canal" }, { status: 502 });
  }
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const sess = await readDemoSession();
  if (!sess) return Response.json({ error: "no_session" }, { status: 401 });
  const { nombre } = (await request.json().catch(() => ({}))) as { nombre?: string };
  const limpio = (nombre ?? "").trim();
  if (!limpio) return Response.json({ error: "falta el nombre" }, { status: 400 });

  const r = await generarMiKey(sess.email, limpio);
  if ("error" in r) {
    const status = r.error === "tope" ? 409 : 502;
    return Response.json({ error: r.error }, { status });
  }
  // la key plana viaja al navegador UNA vez (para copiarla); no se persiste aquí.
  return Response.json({ ok: true, key: r.key, id: r.id });
}

export async function DELETE(request: NextRequest) {
  const sess = await readDemoSession();
  if (!sess) return Response.json({ error: "no_session" }, { status: 401 });
  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return Response.json({ error: "falta id" }, { status: 400 });
  const ok = await revocarMiKey(sess.email, id);
  return Response.json({ ok });
}
