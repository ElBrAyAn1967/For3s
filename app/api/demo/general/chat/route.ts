// POST /api/demo/general/chat — el usuario de la demo General conversa con el
// agente 'general' compartido (Pieza B, 2026-07-20). Multi-tenant: el X-Client-Id
// es el CORREO del usuario (sale de la SESIÓN, nunca del body → un usuario no puede
// suplantar el hilo de otro) → su hilo aislado en el canal API (doctrina AI1).
//
// Body: { message }. Responde { reply }. Solo demo General (las 1:1 tienen su flujo).

import type { NextRequest } from "next/server";
import { readDemoSession } from "@/lib/demo/session";
import { chatGeneral, For3sChatError } from "@/lib/demo/for3sChat";

export async function POST(request: NextRequest) {
  const sess = await readDemoSession();
  if (!sess) {
    return Response.json({ error: "no_session" }, { status: 401 });
  }
  // La identidad = correo de la SESIÓN (httpOnly). NO del body. Riesgo #1 del plan.
  const clientId = sess.email;

  const { message } = (await request.json().catch(() => ({}))) as {
    message?: string;
  };
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "empty_message" }, { status: 400 });
  }
  if (message.length > 4000) {
    return Response.json({ error: "message_too_long" }, { status: 400 });
  }

  try {
    const { reply } = await chatGeneral(clientId, message);
    return Response.json({ reply });
  } catch (e) {
    if (e instanceof For3sChatError) {
      const status = e.kind === "config" ? 503 : (e.status ?? 502);
      return Response.json({ error: e.message }, { status });
    }
    return Response.json({ error: "error interno" }, { status: 500 });
  }
}
