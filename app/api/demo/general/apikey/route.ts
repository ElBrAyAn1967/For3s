// POST /api/demo/general/apikey — recibe la API key del usuario (una vez),
// la CIFRA en el server (AES-256-GCM) y la guarda ligada a su (kind, correo).
//
// La key viaja al server SOLO aquí. Nunca se devuelve, nunca se guarda en claro.
// Persiste cifrada → al volver con el mismo nombre+correo, su sesión ya la tiene.

import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/demo/session";
import { saveApiKey } from "@/lib/demo/userStore";
import { encryptSecret } from "@/lib/demo/crypto";
import { isValidApiKeyFormat, apiKeyHint } from "@/lib/demo/apiKey";
import { registrarByok } from "@/lib/demo/for3sChat";
import { registrarEvento } from "@/lib/demo/eventos";

export async function POST(request: NextRequest) {
  const { sess, error } = await requireSession();
  if (error) return error;

  const { apiKey } = (await request.json().catch(() => ({}))) as {
    apiKey?: string;
  };
  const key = (apiKey ?? "").trim();
  if (!isValidApiKeyFormat(key)) {
    return Response.json({ error: "invalid_format" }, { status: 400 });
  }

  const encBlob = encryptSecret(key);
  const hint = apiKeyHint(key);
  // sess.kind ya viene validado contra demo_instancias (S2) → sin `as DemoKind`.
  await saveApiKey(sess.kind, sess.email, encBlob, hint);

  // Registrar la key en el canal (BYOK) para que el chat responda con el billing
  // del usuario. Best-effort: si falla, la key queda guardada igual y el chat cae a
  // cortesía (no rompe el guardado).
  // P7 · va SIEMPRE al agente donde vive la persona: registrarByok resuelve su
  // instancia real por correo. Antes esto colgaba de `if (sess.kind === "general")`
  // — un nombre de instancia hardcodeado comparado contra un valor de cookie, que
  // dejaba a los dueños sin BYOK.
  void registrarByok(sess.email, key);
  // C5 · Telemetría: conectar la propia key es un momento clave del flujo y no dejaba
  // rastro. registrarEvento resuelve la instancia REAL por correo, así que el evento
  // queda en el agente donde de verdad se guardó (no en el kind de la cookie).
  void registrarEvento({
    tipo: "byok",
    instancia: sess.kind,
    email: sess.email,
    detalle: { hint },
  });

  return Response.json({ ok: true, hint });
}
