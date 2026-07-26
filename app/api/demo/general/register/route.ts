// POST /api/demo/general/register — registra (o continúa) una sesión por
// nombre + correo, para la demo indicada (kind). Normaliza a minúsculas.
//
// Para demos 1:1 (jazz/mashe/brian): el correo debe ser el AUTORIZADO de esa
// demo; si no, se trata herméticamente (404, no revela nada). General no restringe.

import type { NextRequest } from "next/server";
import { registerOrResume } from "@/lib/demo/userStore";
import { setDemoEmail } from "@/lib/demo/session";
import { normalizeEmail, normalizeName, isValidEmail } from "@/lib/demo/normalize";
import { registrarEvento } from "@/lib/demo/eventos";
import { resolverAcceso } from "@/lib/demo/acceso"; // P2: puerta única de acceso
import { instanciaValida } from "@/lib/demo/instancias"; // P1: validación runtime
import type { DemoKind } from "@/lib/demo/types";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    name?: string;
    email?: string;
  };

  const kind = (body.kind ?? "general") as DemoKind;
  // P1 · la instancia se valida contra demo_instancias (runtime), no contra una
  // lista fija: una instancia nueva creada con un INSERT es válida al instante.
  if (!(await instanciaValida(kind))) {
    return Response.json({ error: "invalid_kind" }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const name = normalizeName(body.name ?? "");

  if (!name || !email || !isValidEmail(email)) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  // P2 · UNA sola puerta decide el acceso (lib/demo/acceso.ts). Antes esto eran dos
  // bloques que consultaban 3 fuentes distintas (env vars, demo_llaves, demo_duenos)
  // en cascada — de esa dispersión salieron los bugs del dueño entrando a general.
  // Las respuestas al cliente NO cambian: mismo 404 hermético y mismo 409 es_dueno.
  const acceso = await resolverAcceso(kind, email);
  if (!acceso.permitido) {
    if (acceso.razon === "es_dueno_de_otra") {
      // Es dueño de OTRA instancia: debe verificar su código y entrar a la suya.
      return Response.json(
        { error: "es_dueno", instancia: acceso.instancia },
        { status: 409 },
      );
    }
    // 1:1 sin autorización → hermético (no revela si el correo existe).
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const result = await registerOrResume(kind, name, email, Date.now());

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  // Guardamos kind+correo en cookies para heartbeat/logout/apikey.
  await setDemoEmail(email, kind);
  // C5 · Telemetría: registrar la entrada (o cola). No bloquea la respuesta.
  void registrarEvento({
    tipo: result.status === "waiting" ? "waitlist" : "register",
    instancia: kind,
    email,
    detalle: { status: result.status, returning: result.returning },
  });
  return Response.json(result);
}
