// Cliente del canal API de For3s para la demo General (Pieza B, 2026-07-20).
//
// General multi-tenant: cada usuario de la demo conversa con el agente 'general'
// COMPARTIDO, pero con SU correo como X-Client-Id → su hilo aislado (doctrina AI1
// del canal API). El agente es lo único compartido; cada correo su memoria.
//
// La web llega al general por el Funnel público (for3s.tail6749e5.ts.net → el
// canal API del general en 127.0.0.1:8788 del server). Auth con la key demo del
// general. La conversación reusa /v1/chat (la web es un cliente más, como NavigoX).

const GENERAL_BASE =
  process.env.FOR3S_GENERAL_BASE ?? "https://for3s.tail6749e5.ts.net";
const GENERAL_KEY = process.env.FOR3S_GENERAL_API_KEY ?? "";

export class For3sChatError extends Error {
  constructor(
    message: string,
    public readonly kind: "config" | "red" | "api",
    public readonly status?: number,
  ) {
    super(message);
  }
}

/** Envía un mensaje del usuario al agente general y devuelve su respuesta.
 * clientId = el CORREO del usuario (viene de la sesión, nunca del body) → su hilo.
 * Fail-closed: sin key configurada → error de config (no manda nada). */
export async function chatGeneral(
  clientId: string,
  message: string,
): Promise<{ reply: string }> {
  if (!GENERAL_KEY) {
    throw new For3sChatError(
      "canal general no configurado (FOR3S_GENERAL_API_KEY)",
      "config",
    );
  }
  if (!clientId || !message.trim()) {
    throw new For3sChatError("faltan clientId o message", "api", 400);
  }

  let res: Response;
  try {
    res = await fetch(`${GENERAL_BASE}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": GENERAL_KEY,
        "X-Client-Id": clientId, // el correo → identidad → hilo aislado (AI1)
      },
      body: JSON.stringify({ message: message.trim() }),
      signal: AbortSignal.timeout(95_000), // el LLM puede tardar; corta antes que el edge
    });
  } catch {
    throw new For3sChatError("no llego al agente general", "red");
  }

  if (res.status === 401) {
    throw new For3sChatError("key del general inválida", "api", 401);
  }
  if (res.status === 429) {
    throw new For3sChatError("demasiadas solicitudes, intenta en un momento", "api", 429);
  }
  if (!res.ok) {
    throw new For3sChatError(`el agente respondió ${res.status}`, "api", res.status);
  }

  const data = (await res.json().catch(() => ({}))) as { reply?: string };
  return { reply: data.reply ?? "" };
}

/** Registra la API key de Claude del usuario en el canal (BYOK) para SU clientId.
 * Así /v1/chat responde con SU billing. La key va DESCIFRADA una sola vez por el
 * túnel interno (el canal la re-cifra en su vault). clientId = el correo. */
export async function registrarByok(
  clientId: string,
  claudeKey: string,
): Promise<boolean> {
  if (!GENERAL_KEY || !claudeKey.trim()) return false;
  try {
    const res = await fetch(`${GENERAL_BASE}/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": GENERAL_KEY,
        "X-Client-Id": clientId,
      },
      body: JSON.stringify({ token: claudeKey.trim() }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false; // BYOK es best-effort: si falla, el chat cae a cortesía
  }
}
