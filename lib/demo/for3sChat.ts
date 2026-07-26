// Cliente del canal API de For3s: el ÚNICO teléfono con el que la web habla con
// un agente For3s (chat, BYOK, conectores, keys f3k_).
//
// ── ESTRUCTURA (refactor 2026-07-25) ─────────────────────────────────────────
// Antes cada función reimplementaba el "cómo llamar al agente": resolver el canal,
// derivar el client-id, armar los mismos 3 headers, poner el timeout y envolver en
// try/catch. Eso era el 40% del archivo (116 de 286 líneas de puro andamiaje
// repetido 9 veces) y hacía que agregar un endpoint costara ~25 líneas de copia.
//
// Ahora hay UNA capa base — `llamarAgente()` — que sabe el CÓMO, y cada función
// pública solo declara el QUÉ (ruta, método, cuerpo). Un endpoint nuevo son 3
// líneas, y los timeouts/headers/errores se tocan en un solo lugar.
//
// ── A QUÉ AGENTE SE LLAMA ────────────────────────────────────────────────────
// SIEMPRE al agente DONDE VIVE el usuario (su instancia real, leída de
// demo_instancias), nunca "a general por defecto". Un dueño vive en su propio
// agente: mandar su key/conectores a general los guardaba en el agente equivocado.
// GENERAL_BASE/KEY quedan solo como red de seguridad para el usuario de la demo
// pública cuando no se puede resolver su instancia.

import { createHash } from "node:crypto";
import { canalDe } from "./instancias";
import { instanciaRealDe, hiloDe } from "./userStore";

const GENERAL_BASE =
  process.env.FOR3S_GENERAL_BASE ?? "https://for3s.tail6749e5.ts.net";
const GENERAL_KEY = process.env.FOR3S_GENERAL_API_KEY ?? "";

// Timeouts por tipo de operación (un solo lugar).
const TIMEOUT_CHAT_MS = 95_000; // el LLM puede tardar; corta antes que el edge
const TIMEOUT_LECTURA_MS = 10_000;
const TIMEOUT_ESCRITURA_MS = 15_000;

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

// ── CAPA BASE ────────────────────────────────────────────────────────────────

interface Canal {
  base: string; // sin /v1/...
  key: string;
}

/**
 * Canal del agente DONDE VIVE el usuario. Resuelve su instancia real por correo y
 * devuelve la base + la key descifrada de ESE agente. Cae a general (env) solo si
 * no se puede resolver, dejando rastro en el log para poder diagnosticar.
 */
async function canalDelUsuario(email: string): Promise<Canal | null> {
  const inst = (await instanciaRealDe(email)) ?? "general";
  const canal = await canalDe(inst);
  if (canal) {
    // canal.url apunta a /v1/chat de esa instancia → derivamos su base.
    return { base: canal.url.replace(/\/v1\/chat$/, ""), key: canal.key };
  }
  console.warn(
    `[canal] sin canal para instancia '${inst}' (${email}); fallback general=${!!GENERAL_KEY}`,
  );
  return GENERAL_KEY ? { base: GENERAL_BASE, key: GENERAL_KEY } : null;
}

interface Respuesta<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

/**
 * ⭐ LA capa base: llama al agente del usuario. Sabe el CÓMO (canal, identidad,
 * headers, timeout, parseo, errores) para que las funciones de abajo solo declaren
 * el QUÉ. NUNCA lanza: devuelve { ok, status, data } y quien llama decide.
 *   status 0   → no se pudo resolver el canal (config)
 *   status -1  → fallo de red / timeout
 */
async function llamarAgente<T>(
  email: string,
  ruta: string,
  opts: {
    method?: "GET" | "POST" | "DELETE";
    body?: unknown;
    query?: Record<string, string>;
    timeoutMs?: number;
    canal?: Canal; // para el chat, que ya resolvió su canal (dueño vs general)
  } = {},
): Promise<Respuesta<T>> {
  const canal = opts.canal ?? (await canalDelUsuario(email));
  if (!canal) return { ok: false, status: 0, data: null };

  const qs = opts.query
    ? "?" + new URLSearchParams(opts.query).toString()
    : "";
  const method = opts.method ?? "GET";

  try {
    const res = await fetch(`${canal.base}${ruta}${qs}`, {
      method,
      headers: {
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        "X-API-Key": canal.key,
        "X-Client-Id": clientIdDeCorreo(email),
      },
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
      signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_LECTURA_MS),
    });
    const data = (await res.json().catch(() => null)) as T | null;
    if (!res.ok) {
      console.warn(`[canal] ${method} ${ruta} → HTTP ${res.status} en ${canal.base}`);
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.warn(`[canal] ${method} ${ruta} falló en ${canal.base}: ${(e as Error).message}`);
    return { ok: false, status: -1, data: null };
  }
}

// ── CHAT ─────────────────────────────────────────────────────────────────────

/** Manda un mensaje a un canal ya resuelto y devuelve la respuesta del agente.
 * Lanza For3sChatError tipado: el chat SÍ necesita distinguir config/red/api para
 * que la UI muestre el mensaje correcto (a diferencia del resto, que es best-effort). */
async function enviarMensaje(
  email: string,
  canal: Canal,
  message: string,
  dondeFalla: string,
): Promise<{ reply: string }> {
  if (!message.trim()) {
    throw new For3sChatError("faltan clientId o message", "api", 400);
  }
  // El TEMA (hilo) va SIEMPRE explícito. Antes no se mandaba y el agente aplicaba
  // su default — que era "hoteles", un resto del Incubathon que acababa en el
  // session_id de todas las instancias. El tema correcto ya lo sabe la BD:
  // dueño → 'general' (su memoria de siempre); invitado → 'hilo-<nombre>-<sufijo>'.
  // Si la persona no existe todavía, NO inventamos un tema: que el agente decida.
  const tema = await hiloDe(email);
  const r = await llamarAgente<{ reply?: string }>(email, "/v1/chat", {
    method: "POST",
    body: { message: message.trim(), ...(tema ? { tema } : {}) },
    timeoutMs: TIMEOUT_CHAT_MS,
    canal,
  });
  if (r.status === -1) throw new For3sChatError(dondeFalla, "red");
  if (r.status === 401) throw new For3sChatError("key inválida", "api", 401);
  if (r.status === 429) {
    throw new For3sChatError("demasiadas solicitudes, intenta en un momento", "api", 429);
  }
  if (!r.ok) throw new For3sChatError(`el agente respondió ${r.status}`, "api", r.status);
  return { reply: r.data?.reply ?? "" };
}

/** Chat de un usuario de la demo General con el agente compartido.
 * clientId = su correo (de la sesión, nunca del body) → su hilo aislado. */
export async function chatGeneral(
  email: string,
  message: string,
): Promise<{ reply: string }> {
  const canal = await canalDe("general");
  if (!canal) {
    throw new For3sChatError(
      "canal general no configurado (demo_instancias.general o FOR3S_GENERAL_API_KEY)",
      "config",
    );
  }
  return enviarMensaje(
    email,
    { base: canal.url.replace(/\/v1\/chat$/, ""), key: canal.key },
    message,
    "no llego al agente general",
  );
}

/** Ronda F0 Pieza 3: chat de un DUEÑO verificado con SU instancia.
 * Fail-closed: si su instancia no está expuesta, NO cae a general (no se mezcla
 * al dueño con el pool público). */
export async function chatDueno(
  email: string,
  instancia: string,
  message: string,
): Promise<{ reply: string }> {
  const canal = await canalDe(instancia);
  if (!canal) {
    throw new For3sChatError(`instancia '${instancia}' no expuesta a web`, "config");
  }
  return enviarMensaje(
    email,
    { base: canal.url.replace(/\/v1\/chat$/, ""), key: canal.key },
    message,
    `no llego a la instancia ${instancia}`,
  );
}

// ── CONECTORES (Pieza C) ─────────────────────────────────────────────────────
// Best-effort: devuelven boolean. El detalle del fallo queda en el log del server.

/** Guarda el token de un conector (ej. github) en el vault del agente del usuario. */
export async function guardarConector(
  email: string,
  tipo: string,
  token: string,
): Promise<boolean> {
  if (!token.trim()) return false;
  const r = await llamarAgente(email, "/v1/conector", {
    method: "POST",
    body: { tipo, token: token.trim() },
    timeoutMs: TIMEOUT_ESCRITURA_MS,
  });
  return r.ok;
}

/** ¿El usuario tiene ese conector conectado? (no devuelve el token, solo el estado) */
export async function estadoConector(
  email: string,
  tipo: string,
): Promise<boolean> {
  const r = await llamarAgente<{ conectado?: boolean }>(email, "/v1/conector", {
    query: { tipo },
  });
  return r.ok && !!r.data?.conectado;
}

/** Desconecta un conector (borra su token del vault del agente del usuario). */
export async function borrarConector(
  email: string,
  tipo: string,
): Promise<boolean> {
  const r = await llamarAgente(email, "/v1/conector", {
    method: "DELETE",
    body: { tipo },
  });
  return r.ok;
}

// ── Pieza D · API keys f3k_ self-service (tu For3s en tu app) ────────────────

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

/** Lista las keys f3k_ del usuario (sin la key plana). null si no se pudo leer. */
export async function listarMisKeys(
  email: string,
): Promise<{ keys: MiKey[]; activas: number; tope: number } | null> {
  const r = await llamarAgente<{ keys: MiKey[]; activas: number; tope: number }>(
    email,
    "/v1/miskeys",
  );
  return r.ok ? r.data : null;
}

/** Genera una key f3k_. Devuelve la key PLANA (se muestra una sola vez) o un error
 * ('tope' si ya tiene 3, 'red', 'config', 'http_<código>'). */
export async function generarMiKey(
  email: string,
  nombre: string,
): Promise<{ key: string; id: string } | { error: string }> {
  const r = await llamarAgente<{ key?: string; id?: string; error?: string }>(
    email,
    "/v1/miskeys",
    { method: "POST", body: { nombre }, timeoutMs: TIMEOUT_ESCRITURA_MS },
  );
  if (r.status === 409) return { error: "tope" };
  if (r.status === 0) return { error: "config" };
  if (r.status === -1) return { error: "red" };
  if (!r.ok || !r.data?.key) return { error: r.data?.error ?? `http_${r.status}` };
  return { key: r.data.key, id: r.data.id ?? "" };
}

/** Revoca una key f3k_ del usuario (solo la suya; el canal valida propiedad). */
export async function revocarMiKey(email: string, id: string): Promise<boolean> {
  const r = await llamarAgente(email, "/v1/miskeys", {
    method: "DELETE",
    body: { id },
  });
  return r.ok;
}

// ── BYOK ─────────────────────────────────────────────────────────────────────

/** Registra la API key de Claude del usuario en SU agente (BYOK) para que /v1/chat
 * responda con SU billing. La key va descifrada una sola vez por el túnel interno
 * (el agente la re-cifra en su vault). Best-effort: si falla, el chat cae a cortesía. */
export async function registrarByok(
  email: string,
  claudeKey: string,
): Promise<boolean> {
  if (!claudeKey.trim()) return false;
  const r = await llamarAgente(email, "/v1/token", {
    method: "POST",
    body: { token: claudeKey.trim() },
    timeoutMs: TIMEOUT_ESCRITURA_MS,
  });
  return r.ok;
}
