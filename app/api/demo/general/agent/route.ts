// POST /api/demo/general/agent — enciende/apaga el agente For3s OS del usuario
// (start/stop de su contenedor Docker). SOLO demos 1:1 (jazz/mashe/brian).
// General → 403 (función de pago). Body: { on: boolean }.

import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/demo/session";
import { setAgentState } from "@/lib/demo/userStore";
import { setContainerRunning } from "@/lib/demo/container";
import { getInstancia } from "@/lib/demo/instancias";

export async function POST(request: NextRequest) {
  const { sess, error } = await requireSession();
  if (error) return error;
  const kind = sess.kind; // ya validado contra demo_instancias (S2)

  // Solo las instancias 1:1 pueden manipular su agente; las abiertas (1:M) no
  // (función de pago). El MODO sale de demo_instancias, no de una lista fija:
  // antes era `["jazz","mashe","brian"]` en código, así que una instancia 1:1
  // nueva creada con un INSERT recibía 403 hasta tocar y desplegar este archivo.
  const cfg = await getInstancia(kind);
  if (cfg?.modo !== "1:1") {
    return Response.json({ error: "paid_only" }, { status: 403 });
  }

  const { on } = (await request.json().catch(() => ({}))) as { on?: boolean };
  const turnOn = !!on;

  // 1) Persistimos el estado en BD. 2) Intentamos start/stop del contenedor real
  // (NO-OP si no hay controlador configurado — la UI funciona igual).
  await setAgentState(kind, sess.email, turnOn);
  const dispatched = await setContainerRunning(kind, turnOn);

  return Response.json({ ok: true, agentOn: turnOn, dispatched });
}
