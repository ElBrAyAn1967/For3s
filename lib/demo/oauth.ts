// Flujo OAuth de suscripción de Claude (PKCE) — SOLO para demos 1:1
// (Jazz / Mashe / Brian). General NUNCA usa esto (vía API key legal).
//
// ⚠️ Nota de cumplimiento: este flujo reutiliza el client_id y los headers de
// Claude Code. Anthropic restringe el OAuth de suscripción a Claude Code/Claude.ai;
// usarlo en un tercero es zona prohibida por términos. Decisión explícita de Brian:
// habilitarlo solo para cuentas conocidas 1:1 (riesgo acotado y consciente).
//
// Replica el patrón de Claude Code: un listener local recibe el callback de
// Anthropic, captura el `code` y lo intercambia por un access_token. El navegador
// nunca ve el token (se queda en el server).

import { createHash, randomBytes } from "node:crypto";

// client_id público que usa Claude Code para el OAuth de suscripción.
export const CLAUDE_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
// SOLO SUSCRIPCIÓN (Pro/Max/Team). Pedimos únicamente `user:inference`:
// usa el plan del usuario para inferencia. NO incluimos `org:create_api_key`
// (eso crearía una API key de Console = cobro por tokens) — Brian NO quiere eso.
const SCOPE = "user:inference";

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export interface Pkce {
  verifier: string;
  challenge: string;
  state: string;
}

// Genera el par PKCE (verifier + challenge S256) y un state aleatorio.
export function createPkce(): Pkce {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = b64url(randomBytes(16));
  return { verifier, challenge, state };
}

// URL de autorización a la que el usuario va para iniciar sesión en Claude.
// `redirectUri` apunta a nuestro listener local (replica el CLI).
export function buildAuthorizeUrl(pkce: Pkce, redirectUri: string): string {
  const params = new URLSearchParams({
    code: "true",
    response_type: "code",
    client_id: CLAUDE_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: SCOPE,
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    state: pkce.state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
}

// Intercambia el authorization code por el access_token (server-side).
export async function exchangeCode(
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<TokenResult> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "anthropic",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      client_id: CLAUDE_CLIENT_ID,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`token_exchange_failed_${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
  };
}
