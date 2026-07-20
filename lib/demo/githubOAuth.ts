// OAuth de GitHub para conectores self-service (Pieza C, 2026-07-20).
//
// Flujo estándar de GitHub OAuth App (Authorization Code):
//   1. /start → redirige a github.com/login/oauth/authorize con un `state` (CSRF).
//   2. GitHub vuelve al callback con ?code&state.
//   3. /callback valida el state → intercambia el code por access_token (server-side,
//      con el client secret) → manda el token al canal API (gh_<correo>) → cifrado.
//
// El client SECRET vive SOLO server-side (env), nunca al navegador. El token del
// usuario tampoco vuelve al navegador: se guarda en el vault de la instancia.
//
// Registro de la OAuth App (cuenta personal de Brian, fruterito101 — decisión
// 2026-07-20): GitHub > Settings > Developer settings > OAuth Apps > New OAuth App.
//   - Homepage:            https://for3s.tail6749e5.ts.net
//   - Authorization callback URL:
//       https://for3s.tail6749e5.ts.net/api/demo/connectors/github/callback
//   - Scopes (v1 read): se piden en el authorize URL (`read:user repo` para leer repos).
//   → pegar Client ID/Secret en .env.local: GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET

import { randomBytes } from "node:crypto";

const CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET ?? "";
const SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_BASE ?? "https://for3s.tail6749e5.ts.net";

export const GITHUB_CALLBACK = `${SITE_BASE}/api/demo/connectors/github/callback`;
// v1 read-only: leer perfil + repos. Sin write scopes (writes por la web fuera de C).
const SCOPES = "read:user repo";

export function isGithubOAuthConfigured(): boolean {
  return !!CLIENT_ID && !!CLIENT_SECRET;
}

/** state aleatorio anti-CSRF (se guarda en cookie httpOnly y se valida al volver). */
export function newState(): string {
  return randomBytes(16).toString("base64url");
}

/** URL de authorize de GitHub para arrancar el consentimiento. */
export function buildGithubAuthorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK,
    scope: SCOPES,
    state,
    allow_signup: "false",
  });
  return `https://github.com/login/oauth/authorize?${p.toString()}`;
}

/** Intercambia el authorization code por el access_token (server-side). */
export async function exchangeGithubCode(code: string): Promise<string | null> {
  if (!isGithubOAuthConfigured()) return null;
  let res: Response;
  try {
    res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
  };
  return data.access_token ?? null;
}
