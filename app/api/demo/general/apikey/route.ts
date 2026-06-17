// POST /api/demo/general/apikey — recibe la API key del usuario (una vez),
// la CIFRA en el server (AES-256-GCM) y la guarda ligada a su (kind, correo).
//
// La key viaja al server SOLO aquí. Nunca se devuelve, nunca se guarda en claro.
// Persiste cifrada → al volver con el mismo nombre+correo, su sesión ya la tiene.

import type { NextRequest } from "next/server";
import { readDemoSession } from "@/lib/demo/session";
import { saveApiKey } from "@/lib/demo/userStore";
import { encryptSecret } from "@/lib/demo/crypto";
import { isValidApiKeyFormat, apiKeyHint } from "@/lib/demo/apiKey";
import type { DemoKind } from "@/lib/demo/types";

export async function POST(request: NextRequest) {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }

  const { apiKey } = (await request.json().catch(() => ({}))) as {
    apiKey?: string;
  };
  const key = (apiKey ?? "").trim();
  if (!isValidApiKeyFormat(key)) {
    return Response.json({ error: "invalid_format" }, { status: 400 });
  }

  const encBlob = encryptSecret(key);
  const hint = apiKeyHint(key);
  await saveApiKey(sess.kind as DemoKind, sess.email, encBlob, hint);

  return Response.json({ ok: true, hint });
}
