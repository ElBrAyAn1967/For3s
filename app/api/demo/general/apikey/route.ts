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

  return Response.json({ ok: true, hint });
}
