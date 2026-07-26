// POST /api/demo/general/agent — enciende/apaga el agente For3s OS.
//
// ⭐ REGLA (Brian 2026-07-26): SOLO EL DUEÑO de la instancia puede apagar su agente.
// Ni visitantes de general, ni invitados con llave. El agente es la máquina donde
// vive la memoria del dueño: que un invitado pueda apagársela es un ataque de
// denegación de servicio contra el dueño, no una función.
//
// Body: { on: boolean }. La orden se ESCRIBE en demo_users.agent_on; el mini-agente
// for3s-ctl del server la lee y ejecuta el docker start/stop (ver lib/demo/container.ts).

import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/demo/session";
import { setAgentState } from "@/lib/demo/userStore";
import { setContainerRunning } from "@/lib/demo/container";
import { getInstancia } from "@/lib/demo/instancias";
import { instanciaDe } from "@/lib/demo/duenos";
import { registrarEvento } from "@/lib/demo/eventos";

export async function POST(request: NextRequest) {
  const { sess, error } = await requireSession();
  if (error) return error;
  const kind = sess.kind; // ya validado contra demo_instancias (S2)

  // 1) Solo instancias 1:1 tienen agente propio. El MODO sale de demo_instancias, no
  // de una lista fija: antes era `["jazz","mashe","brian"]` en código, así que una
  // instancia 1:1 nueva creada con un INSERT recibía 403 hasta desplegar este archivo.
  const cfg = await getInstancia(kind);
  if (cfg?.modo !== "1:1") {
    return Response.json({ error: "paid_only" }, { status: 403 });
  }

  // 2) 🔒 ¿Es EL DUEÑO de ESTA instancia? Se comprueba contra demo_duenos (fuente de
  // verdad), no contra la cookie ni el rol guardado. Antes este endpoint solo miraba
  // que la instancia fuera 1:1, así que un INVITADO con llave a 'brian' podía
  // apagarle el agente al dueño.
  const dueno = await instanciaDe(sess.email);
  if (!dueno || dueno.instancia !== kind) {
    return Response.json({ error: "solo_el_dueno" }, { status: 403 });
  }

  const { on } = (await request.json().catch(() => ({}))) as { on?: boolean };
  const turnOn = !!on;

  // 3) La orden se persiste en BD (agent_on). El mini-agente for3s-ctl la aplica en
  // su siguiente ciclo → `aplicado:false` significa "en camino", no "falló".
  await setAgentState(kind, sess.email, turnOn);
  const dispatched = await setContainerRunning(kind, turnOn);
  void registrarEvento({
    tipo: "agente",
    instancia: kind,
    email: sess.email,
    detalle: { on: turnOn },
  });

  return Response.json({ ok: true, agentOn: turnOn, aplicado: dispatched });
}
