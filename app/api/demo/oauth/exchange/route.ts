// POST /api/demo/oauth/exchange — recibe el authorization code que el usuario
// pegó (Anthropic lo mostró en pantalla) y lo intercambia por el access_token.
//
// ⚠️ SOLO PRUEBAS INTERNAS — NO LEGAL EN PRODUCCIÓN. Ver lib/demo/oauthGuard.ts.
// El token NUNCA llega al navegador: se intercambia y persiste server-side.

import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/demo/oauth";
import {
  OAUTH_REDIRECT_URI,
  getPendingState,
  clearPendingState,
} from "@/lib/demo/oauthListener";
import { isOAuthInternalEnabled } from "@/lib/demo/oauthGuard";

export async function POST(request: NextRequest) {
  if (!isOAuthInternalEnabled()) {
    return Response.json({ error: "oauth_disabled" }, { status: 403 });
  }

  const { code: raw } = (await request.json().catch(() => ({}))) as {
    code?: string;
  };
  if (!raw || !raw.trim()) {
    return Response.json({ error: "missing_code" }, { status: 400 });
  }

  // Anthropic presenta el código como "code#state". Separamos y validamos state.
  const [code, returnedState] = raw.trim().split("#");
  const expectedState = getPendingState();
  if (returnedState && expectedState && returnedState !== expectedState) {
    return Response.json({ error: "state_mismatch" }, { status: 400 });
  }

  const store = await cookies();
  const verifier = store.get("for3s_oauth_verifier")?.value;
  if (!verifier) {
    return Response.json({ error: "missing_verifier" }, { status: 400 });
  }

  try {
    const token = await exchangeCode(code, verifier, OAUTH_REDIRECT_URI);
    clearPendingState();
    store.delete("for3s_oauth_verifier");

    // FASE 1: no persistimos el token aún (sin cifrado KEK / sin BD). Solo
    // confirmamos la conexión con un hint seguro. El token real se guardará
    // cifrado en Fase 2 para usarlo en la inferencia con la suscripción.
    const hint = `…${token.accessToken.slice(-4)}`;
    return Response.json({ status: "connected", hint });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "exchange_failed";
    return Response.json({ status: "error", error: msg }, { status: 502 });
  }
}
