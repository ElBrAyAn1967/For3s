// Cliente del canal API de For3s para la demo General (Pieza B, 2026-07-20).
//
// General multi-tenant: cada usuario de la demo conversa con el agente 'general'
// COMPARTIDO, pero con SU correo como X-Client-Id → su hilo aislado (doctrina AI1
// del canal API). El agente es lo único compartido; cada correo su memoria.
//
// La web llega al general por el Funnel público (for3s.tail6749e5.ts.net → el
// canal API del general en 127.0.0.1:8788 del server). Auth con la key demo del
// general. La conversación reusa /v1/chat (la web es un cliente más, como NavigoX).

import { createHash } from "node:crypto";

const GENERAL_BASE =
  process.env.FOR3S_GENERAL_BASE ?? "https://for3s.tail6749e5.ts.net";
const GENERAL_KEY = process.env.FOR3S_GENERAL_API_KEY ?? "";

// Ronda F0 Pieza 3: enrutado por instancia. Cada instancia expuesta tiene su
// RUTA en el Funnel (/i/<instancia>) y su PROPIA key. El dueño verificado (Pieza
// 2) va a SU instancia, no a general. Config por env: FOR3S_INST_<INSTANCIA>_KEY.
// La base es la misma (Funnel), cambia la ruta. Un mapa vacío = solo general.
const FUNNEL_BASE =
  process.env.FOR3S_GENERAL_BASE ?? "https://for3s.tail6749e5.ts.net";

// Devuelve { base, key } para hablar con una instancia dueña, o null si no está
// configurada (→ el caller cae a general). La key vive en env (nunca en el cliente).
function canalDeInstancia(instancia: string): { url: string; key: string } | null {
  const key = process.env[`FOR3S_INST_${instancia.toUpperCase()}_KEY`];
  if (!key) return null;
  return { url: `${FUNNEL_BASE}/i/${instancia}/v1/chat`, key };
}

// 🔴 BUG DE AISLAMIENTO CAZADO (2026-07-20): el canal API sanea el X-Client-Id con
// _limpiar_id, que BORRA @ . + (solo deja [a-z0-9_-]) y trunca a 32. Con correos
// reales eso COLISIONA usuarios distintos (a+b@x.com, ab.test@x.com, a.b.test@x.com
// → todos "abtestxcom" → MISMO hilo/vault: fuga entre usuarios). Fix: derivar un id
// ESTABLE y ÚNICO del correo (hash), así cada correo tiene su id [a-z0-9] intacto
// por _limpiar_id, y dos correos distintos NUNCA colisionan. El correo se normaliza
// (minúsculas+trim) para que el mismo correo dé siempre el mismo id.
export function clientIdDeCorreo(email: string): string {
  const norm = (email || "").trim().toLowerCase();
  // 24 hex chars = 96 bits: unicidad de sobra, y < 32 (no lo trunca _limpiar_id).
  return "u" + createHash("sha256").update(norm).digest("hex").slice(0, 24);
}

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
  email: string,
  message: string,
): Promise<{ reply: string }> {
  const clientId = clientIdDeCorreo(email);
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

/** Ronda F0 Pieza 3: chat de un DUEÑO verificado con SU instancia (brian/jazz/…).
 * Enruta a /i/<instancia> con la key de esa instancia. El X-Client-Id sigue siendo
 * el hash de su correo → su hilo aislado en SU instancia (mismo mecanismo que general).
 * Si la instancia no está configurada (sin key en env) → error de config (fail-closed:
 * NO cae a general silenciosamente, para no mezclar el dueño con el pool público). */
export async function chatDueno(
  email: string,
  instancia: string,
  message: string,
): Promise<{ reply: string }> {
  const canal = canalDeInstancia(instancia);
  if (!canal) {
    throw new For3sChatError(`instancia '${instancia}' no expuesta a web`, "config");
  }
  const clientId = clientIdDeCorreo(email);
  if (!clientId || !message.trim()) {
    throw new For3sChatError("faltan clientId o message", "api", 400);
  }

  let res: Response;
  try {
    res = await fetch(canal.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": canal.key,
        "X-Client-Id": clientId,
      },
      body: JSON.stringify({ message: message.trim() }),
      signal: AbortSignal.timeout(95_000),
    });
  } catch {
    throw new For3sChatError(`no llego a la instancia ${instancia}`, "red");
  }

  if (res.status === 401) throw new For3sChatError("key de la instancia inválida", "api", 401);
  if (res.status === 429) throw new For3sChatError("demasiadas solicitudes, intenta en un momento", "api", 429);
  if (!res.ok) throw new For3sChatError(`la instancia respondió ${res.status}`, "api", res.status);

  const data = (await res.json().catch(() => ({}))) as { reply?: string };
  return { reply: data.reply ?? "" };
}

/** Guarda el token de un conector (ej. github) del usuario en el vault del canal,
 * ligado a SU clientId (correo). Pieza C. Devuelve true si el canal lo aceptó. */
export async function guardarConector(
  email: string,
  tipo: string,
  token: string,
): Promise<boolean> {
  const clientId = clientIdDeCorreo(email);
  if (!GENERAL_KEY || !token.trim()) return false;
  try {
    const res = await fetch(`${GENERAL_BASE}/v1/conector`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": GENERAL_KEY,
        "X-Client-Id": clientId,
      },
      body: JSON.stringify({ tipo, token: token.trim() }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** ¿El usuario tiene un conector conectado? (no devuelve el token, solo el estado) */
export async function estadoConector(
  email: string,
  tipo: string,
): Promise<boolean> {
  const clientId = clientIdDeCorreo(email);
  if (!GENERAL_KEY) return false;
  try {
    const res = await fetch(
      `${GENERAL_BASE}/v1/conector?tipo=${encodeURIComponent(tipo)}`,
      {
        headers: { "X-API-Key": GENERAL_KEY, "X-Client-Id": clientId },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json().catch(() => ({}))) as { conectado?: boolean };
    return !!data.conectado;
  } catch {
    return false;
  }
}

/** Desconecta un conector del usuario (borra su token del vault). Pieza C. */
export async function borrarConector(
  email: string,
  tipo: string,
): Promise<boolean> {
  const clientId = clientIdDeCorreo(email);
  if (!GENERAL_KEY) return false;
  try {
    const res = await fetch(`${GENERAL_BASE}/v1/conector`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": GENERAL_KEY,
        "X-Client-Id": clientId,
      },
      body: JSON.stringify({ tipo }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Pieza D · API keys f3k_ self-service (tu For3s en tu app) ─────────────────

// Un punto de la serie de uso (por día) → la línea que sube/baja.
export interface UsoPunto {
  fecha: string; // "YYYY-MM-DD"
  llamadas: number;
}

export interface MiKey {
  id: string;
  nombre: string;
  estado: string;
  creada: string;
  ultimo_uso: string | null;
  // Uso real (lo agrega el canal desde api_consumo). Opcionales: keys de antes
  // del cambio o si el conteo falla vienen sin ellos → el UI cae a 0.
  total_llamadas?: number;
  total_tokens?: number;
  costo_usd?: number; // solo NUESTRO cupo (byok=false)
  serie?: UsoPunto[];
}

/** Lista las keys f3k_ del usuario (sin la key plana). */
export async function listarMisKeys(
  email: string,
): Promise<{ keys: MiKey[]; activas: number; tope: number } | null> {
  const clientId = clientIdDeCorreo(email);
  if (!GENERAL_KEY) return null;
  try {
    const res = await fetch(`${GENERAL_BASE}/v1/miskeys`, {
      headers: { "X-API-Key": GENERAL_KEY, "X-Client-Id": clientId },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as { keys: MiKey[]; activas: number; tope: number };
  } catch {
    return null;
  }
}

/** Genera una key f3k_ del usuario. Devuelve la key PLANA (mostrar 1 vez) o un
 * error (ej. 'tope' si ya tiene 3). */
export async function generarMiKey(
  email: string,
  nombre: string,
): Promise<{ key: string; id: string } | { error: string }> {
  const clientId = clientIdDeCorreo(email);
  if (!GENERAL_KEY) return { error: "config" };
  try {
    const res = await fetch(`${GENERAL_BASE}/v1/miskeys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": GENERAL_KEY,
        "X-Client-Id": clientId,
      },
      body: JSON.stringify({ nombre }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      key?: string;
      id?: string;
      error?: string;
    };
    if (res.status === 409) return { error: "tope" };
    if (!res.ok || !data.key) return { error: data.error ?? "error" };
    return { key: data.key, id: data.id ?? "" };
  } catch {
    return { error: "red" };
  }
}

/** Revoca una key f3k_ del usuario (solo la suya; el canal valida propiedad). */
export async function revocarMiKey(email: string, id: string): Promise<boolean> {
  const clientId = clientIdDeCorreo(email);
  if (!GENERAL_KEY) return false;
  try {
    const res = await fetch(`${GENERAL_BASE}/v1/miskeys`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": GENERAL_KEY,
        "X-Client-Id": clientId,
      },
      body: JSON.stringify({ id }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Registra la API key de Claude del usuario en el canal (BYOK) para SU clientId.
 * Así /v1/chat responde con SU billing. La key va DESCIFRADA una sola vez por el
 * túnel interno (el canal la re-cifra en su vault). clientId = el correo. */
export async function registrarByok(
  email: string,
  claudeKey: string,
): Promise<boolean> {
  const clientId = clientIdDeCorreo(email);
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
