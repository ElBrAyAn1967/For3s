// POST /api/demo/general/profile — edita el perfil (nombre y/o API key).
// Los cambios se reflejan en la BD. El correo NO se cambia (es la identidad).
// La foto NO pasa por aquí: vive solo en localStorage del navegador.

import type { NextRequest } from "next/server";
import { readDemoSession } from "@/lib/demo/session";
import { updateName, saveApiKey } from "@/lib/demo/userStore";
import { encryptSecret } from "@/lib/demo/crypto";
import { isValidApiKeyFormat, apiKeyHint } from "@/lib/demo/apiKey";
import { normalizeName } from "@/lib/demo/normalize";
import type { DemoKind } from "@/lib/demo/types";

export async function POST(request: NextRequest) {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }
  const kind = sess.kind as DemoKind;

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    apiKey?: string;
  };

  let newHint: string | null = null;

  // Nombre (si viene): normalizado a minúsculas, se refleja en BD.
  if (typeof body.name === "string" && body.name.trim()) {
    await updateName(kind, sess.email, normalizeName(body.name));
  }

  // API key (si viene): valida formato, cifra y guarda. Nunca vuelve en claro.
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    const key = body.apiKey.trim();
    if (!isValidApiKeyFormat(key)) {
      return Response.json({ error: "invalid_format" }, { status: 400 });
    }
    newHint = apiKeyHint(key);
    await saveApiKey(kind, sess.email, encryptSecret(key), newHint);
  }

  return Response.json({ ok: true, hint: newHint });
}
