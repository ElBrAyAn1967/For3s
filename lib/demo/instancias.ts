// Fuente de verdad de las INSTANCIAS (leída de demo_instancias en Neon).
//
// Reemplaza el hardcodeo repartido: el puente en env vars (FOR3S_INST_*) + la URL
// armada en código (canalDeInstancia), y los cupos constantes (MAX_CONCURRENT).
// Ahora TODO sale de demo_instancias — agregar una instancia = 1 INSERT, cero código.
//
// Cache corta (10s) para no golpear Neon en cada request pero reflejar cambios casi
// al instante (un UPDATE de cupo/puente se ve en ≤10s, sin redeploy).
//
// Red de seguridad (transición): si la fila aún no tiene canal/cupo, cae a las env
// vars / defaults de hoy. Así el cableado no rompe nada mientras se completa.

import { db } from "./db";
import { decryptSecret } from "./crypto";
import { MAX_CONCURRENT, type DemoKind } from "./types";
import { cacheInstanciasMs } from "./config";

export interface InstanciaConfig {
  instancia: string;
  modo: string;              // '1:1' | '1:M'
  max_concurrent: number;
  canal_url: string | null;
  canal_key_enc: string | null;
  activa: boolean;
}

// TTL del cache: sale de demo_config.cache_config_seg (editable sin push; default 10s).

// Cache en memoria del proceso: instancia → { config, expira }.
type CacheEntry = { config: InstanciaConfig | null; expira: number };
const cache = new Map<string, CacheEntry>();

/** Lee la config de UNA instancia desde demo_instancias (con cache 10s). */
export async function getInstancia(instancia: string): Promise<InstanciaConfig | null> {
  const key = instancia.trim().toLowerCase();
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expira > now) return hit.config;

  const sql = db();
  const [row] = await sql<InstanciaConfig[]>`
    SELECT instancia, modo, max_concurrent, canal_url, canal_key_enc, activa
    FROM demo_instancias WHERE instancia = ${key}
  `;
  const config = row ?? null;
  cache.set(key, { config, expira: now + (await cacheInstanciasMs()) });
  return config;
}

/** Invalida la cache de una instancia (o toda). Útil tras un UPDATE administrativo. */
export function invalidarCache(instancia?: string): void {
  if (instancia) cache.delete(instancia.trim().toLowerCase());
  else cache.clear();
}

/**
 * C1 · PUENTE. Devuelve { url, key } para hablar con una instancia, o null si no
 * está expuesta. La key sale CIFRADA de la BD y se descifra aquí (nunca en claro
 * en la BD, nunca en el cliente). Fallback a env var durante la transición.
 */
export async function canalDe(
  instancia: string,
): Promise<{ url: string; key: string } | null> {
  const cfg = await getInstancia(instancia);
  if (cfg?.canal_url && cfg.canal_key_enc) {
    try {
      return { url: cfg.canal_url, key: decryptSecret(cfg.canal_key_enc) };
    } catch {
      // blob corrupto → cae al fallback de env (transición segura)
    }
  }
  // Fallback (transición): env vars de hoy. Se elimina cuando la BD sea la única fuente.
  const base = process.env.FOR3S_GENERAL_BASE ?? "https://for3s.tail6749e5.ts.net";
  const envKey =
    instancia.toLowerCase() === "general"
      ? process.env.FOR3S_GENERAL_API_KEY
      : process.env[`FOR3S_INST_${instancia.toUpperCase()}_KEY`];
  if (!envKey) return null;
  const url =
    instancia.toLowerCase() === "general"
      ? `${base}/v1/chat`
      : `${base}/i/${instancia}/v1/chat`;
  return { url, key: envKey };
}

/**
 * C3 · CUPO. Devuelve max_concurrent de la instancia desde la BD (con cache).
 * Fallback al MAX_CONCURRENT de hoy si la instancia no está en la BD (transición).
 */
export async function cupoDe(instancia: string): Promise<number> {
  const cfg = await getInstancia(instancia);
  if (cfg && cfg.max_concurrent > 0) return cfg.max_concurrent;
  return MAX_CONCURRENT[instancia as DemoKind] ?? 1;
}
