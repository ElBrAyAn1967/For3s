// POST /api/demo/general/chat — el usuario de la demo General conversa con el
// agente 'general' compartido (Pieza B, 2026-07-20). Multi-tenant: el X-Client-Id
// es el CORREO del usuario (sale de la SESIÓN, nunca del body → un usuario no puede
// suplantar el hilo de otro) → su hilo aislado en el canal API (doctrina AI1).
//
// Body: { message }. Responde { reply }. Solo demo General (las 1:1 tienen su flujo).

import type { NextRequest } from "next/server";
import { requireSession, readDuenoVerificado } from "@/lib/demo/session";
import { chatGeneral, chatDueno, For3sChatError } from "@/lib/demo/for3sChat";
import { registrarEvento } from "@/lib/demo/eventos";
import { agenteEncendidoDe } from "@/lib/demo/userStore";

export async function POST(request: NextRequest) {
  const { sess, error } = await requireSession();
  if (error) return error;
  // La identidad = correo de la SESIÓN (httpOnly). NO del body. Riesgo #1 del plan.
  // chatGeneral deriva el client_id ESTABLE del correo (hash) — ver clientIdDeCorreo.
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
    // Ronda F0 Pieza 3: si este correo probó ser dueño de una instancia (verificó
    // por código, cookie httpOnly), su chat va a SU instancia, no a general.
    // El correo del dueño verificado debe coincidir con el de la sesión (misma persona).
    const dueno = await readDuenoVerificado();
    if (dueno && dueno.email === sess.email) {
      // 🐛 Hallazgo auditoría 2026-07-26: si el dueño APAGÓ su agente, esto mandaba
      // la petición a un contenedor muerto y devolvía "no llegó a la instancia X" —
      // un error de RED que tapaba la causa real. El dato estaba en la BD sin usarse.
      // Solo aplica al dueño: es el único que puede apagar su agente.
      if (!(await agenteEncendidoDe(sess.email))) {
        return Response.json(
          { error: "agente_apagado", instancia: dueno.instancia },
          { status: 409 },
        );
      }
      const { reply } = await chatDueno(sess.email, dueno.instancia, message);
      // C5 · Telemetría: chat del dueño → su instancia.
      void registrarEvento({ tipo: "chat", instancia: dueno.instancia, email: sess.email, detalle: { rol: "dueno" } });
      return Response.json({ reply });
    }
    const { reply } = await chatGeneral(sess.email, message);
    // C5 · Telemetría: la instancia REAL la resuelve registrarEvento por correo, así
    // que aquí ya no hace falta pedirla aparte (antes: instanciaRealDe(...).then(...)).
    void registrarEvento({
      tipo: "chat",
      instancia: sess.kind, // respaldo por si la persona aún no tiene fila
      email: sess.email,
      detalle: { rol: "visitante" },
    });
    return Response.json({ reply });
  } catch (e) {
    if (e instanceof For3sChatError) {
      const status = e.kind === "config" ? 503 : (e.status ?? 502);
      return Response.json({ error: e.message }, { status });
    }
    return Response.json({ error: "error interno" }, { status: 500 });
  }
}
