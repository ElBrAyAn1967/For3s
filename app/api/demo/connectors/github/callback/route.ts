// GET /api/demo/connectors/github/callback — GitHub vuelve aquí con ?code&state.
// (Pieza C) Valida el state (CSRF), intercambia el code por el access_token
// (server-side), lo guarda cifrado en el vault del canal (gh_<correo>) y redirige
// de vuelta al shell de la demo (pestaña Conectores).

import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { readDemoSession } from "@/lib/demo/session";
import { exchangeGithubCode } from "@/lib/demo/githubOAuth";
import { guardarConector } from "@/lib/demo/for3sChat";

const STATE_COOKIE = "for3s_gh_oauth_state";

function volverAlPanel(ok: boolean): Response {
  // vuelve al shell; el panel de conectores refresca su estado real al montar.
  const q = ok ? "github=connected" : "github=error";
  return Response.redirect(
    `${process.env.NEXT_PUBLIC_SITE_BASE ?? "https://for3s.tail6749e5.ts.net"}/demo?${q}`,
    302,
  );
}

export async function GET(request: NextRequest) {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE); // un solo uso

  // Validación anti-CSRF: el state debe existir y coincidir. Fail-closed.
  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return volverAlPanel(false);
  }

  const token = await exchangeGithubCode(code);
  if (!token) {
    return volverAlPanel(false);
  }

  // Guardar en el vault del canal, ligado al CORREO de la sesión (no del body).
  const ok = await guardarConector(sess.email, "github", token);
  return volverAlPanel(ok);
}
