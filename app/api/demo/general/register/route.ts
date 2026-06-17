// POST /api/demo/general/register — registra (o continúa) una sesión por
// nombre + correo, para la demo indicada (kind). Normaliza a minúsculas.
//
// Para demos 1:1 (jazz/mashe/brian): el correo debe ser el AUTORIZADO de esa
// demo; si no, se trata herméticamente (404, no revela nada). General no restringe.

import type { NextRequest } from "next/server";
import { registerOrResume } from "@/lib/demo/userStore";
import { setDemoEmail } from "@/lib/demo/session";
import { normalizeEmail, normalizeName, isValidEmail } from "@/lib/demo/normalize";
import { isEmailAllowed } from "@/lib/demo/allowedEmails";
import type { DemoKind } from "@/lib/demo/types";

const VALID: DemoKind[] = ["jazz", "mashe", "brian", "general"];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    name?: string;
    email?: string;
  };

  const kind = (body.kind ?? "general") as DemoKind;
  if (!VALID.includes(kind)) {
    return Response.json({ error: "invalid_kind" }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const name = normalizeName(body.name ?? "");

  if (!name || !email || !isValidEmail(email)) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  // Demos 1:1: solo el correo autorizado entra. Si no, 404 (hermético).
  if (!isEmailAllowed(kind, email)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const result = await registerOrResume(kind, name, email, Date.now());

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  // Guardamos kind+correo en cookies para heartbeat/logout/apikey.
  await setDemoEmail(email, kind);
  return Response.json(result);
}
