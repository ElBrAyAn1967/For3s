// POST /api/demo/general/agent — enciende/apaga el agente For3s OS del usuario
// (start/stop de su contenedor Docker). SOLO demos 1:1 (jazz/mashe/brian).
// General → 403 (función de pago). Body: { on: boolean }.

import type { NextRequest } from "next/server";
import { readDemoSession } from "@/lib/demo/session";
import { setAgentState } from "@/lib/demo/userStore";
import { setContainerRunning } from "@/lib/demo/container";
import type { DemoKind } from "@/lib/demo/types";

const ONE_TO_ONE: DemoKind[] = ["jazz", "mashe", "brian"];

export async function POST(request: NextRequest) {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }
  const kind = sess.kind as DemoKind;

  // General no puede manipular el agente (función solo para usuarios de pago).
  if (!ONE_TO_ONE.includes(kind)) {
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
