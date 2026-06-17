// POST /api/demo/oauth/start — inicia el OAuth de suscripción Claude.
//
// ⚠️ SOLO PRUEBAS INTERNAS — NO LEGAL EN PRODUCCIÓN. Ver lib/demo/oauthGuard.ts.
// Requiere DEMO_OAUTH_INTERNAL=1 y kind ∈ {jazz,mashe,brian}. General nunca.

import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl, createPkce } from "@/lib/demo/oauth";
import { OAUTH_REDIRECT_URI, setPendingState } from "@/lib/demo/oauthListener";
import { isOAuthAllowed } from "@/lib/demo/oauthGuard";

export async function POST(request: NextRequest) {
  const { kind } = (await request.json().catch(() => ({}))) as { kind?: string };
  if (!isOAuthAllowed(kind)) {
    return Response.json({ error: "oauth_not_allowed" }, { status: 403 });
  }

  const pkce = createPkce();
  setPendingState(pkce.state); // para validar el code pegado más tarde

  // El verifier se guarda server-side (cookie httpOnly), nunca en el navegador JS.
  const store = await cookies();
  store.set("for3s_oauth_verifier", pkce.verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 min para completar el login
  });

  // Anthropic mostrará el authorization code en pantalla tras autorizar;
  // el usuario lo pega en For3s (no hay callback automático con este client_id).
  const authorizeUrl = buildAuthorizeUrl(pkce, OAUTH_REDIRECT_URI);
  return Response.json({ authorizeUrl });
}
