// GET /api/demo/connectors/github/start — arranca el OAuth de GitHub del usuario
// (Pieza C). Guarda un `state` anti-CSRF en cookie httpOnly y redirige a GitHub.
// Solo con sesión de demo (el correo será el dueño del conector).

import { cookies } from "next/headers";
import { readDemoSession } from "@/lib/demo/session";
import {
  isGithubOAuthConfigured,
  newState,
  buildGithubAuthorizeUrl,
} from "@/lib/demo/githubOAuth";

const STATE_COOKIE = "for3s_gh_oauth_state";

export async function GET() {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }
  if (!isGithubOAuthConfigured()) {
    return Response.json({ error: "github_oauth_not_configured" }, { status: 503 });
  }

  const state = newState();
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 min para completar el consentimiento
  });

  return Response.redirect(buildGithubAuthorizeUrl(state), 302);
}
