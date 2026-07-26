// Fuente de verdad de las INSTANCIAS (leída de demo_instancias en Neon).
//
// Agregar una instancia = 1 INSERT, cero código: la validez, el cupo y el puente
// (URL + key cifrada) salen todos de la BD.
//
// ── FORMA BASE (refactor 2026-07-26) ─────────────────────────────────────────
// Este archivo sigue el MISMO patrón que config.ts, que es el estándar del módulo:
//
//   1. UNA sola función privada que habla con la BD  (`leerFila`)
//   2. cache corta encima de ella, con try/catch      (nunca rompe por BD caída)
//   3. getters con nombre que solo declaran el QUÉ    (`cupoDe`, `canalDe`, …)
//
// Antes cada getter repetía la normalización del nombre (6 veces `.trim().
// toLowerCase()`), y `getInstancia` NO tenía try/catch: si Neon fallaba, LANZABA.
// Eso rompía la red de seguridad que los comentarios prometían — `instanciaValida`
// decía "si la BD no responde cae a las semillas" pero nunca llegaba al fallback,
// porque la excepción subía antes. Ahora la promesa se cumple de verdad.
//
// ── DEGRADACIÓN (qué pasa si Neon no responde) ───────────────────────────────
// Ningún getter lanza. Cada uno degrada a un valor seguro y deja rastro en el log:
//   getInstancia  → null          (quien llama decide)
//   instanciaValida → semillas    (la demo sigue de pie)
//   cupoDe        → MAX_CONCURRENT de types.ts
//   canalDe       → null          (falla CLARA: "sin canal", no un 401 confuso)

import { db } from "./db";
import { decryptSecret } from "./crypto";
import { MAX_CONCURRENT, INSTANCIAS_SEMILLA, type DemoKind } from "./types";
import { cacheInstanciasMs } from "./config";

export interface InstanciaConfig {
  instancia: string;
  modo: string; // '1:1' | '1:M'
  max_concurrent: number;
  canal_url: string | null;
  canal_key_enc: string | null;
  activa: boolean;
}

// ── NÚCLEO ───────────────────────────────────────────────────────────────────

/**
 * I1 · Normaliza el nombre de instancia. UN solo lugar: antes esta línea estaba
 * repetida en 6 sitios y bastaba olvidarla en uno para que 'Brian' no encontrara
 * la fila de 'brian'.
 */
const norm = (instancia: string): string => instancia.trim().toLowerCase();

// Cache en memoria del proceso: instancia → { config, expira }. TTL desde
// demo_config.cache_config_seg (editable con un UPDATE, sin push; default 10s).
type CacheEntry = { config: InstanciaConfig | null; expira: number };
const cache = new Map<string, CacheEntry>();

/**
 * I2 · LA única función que consulta demo_instancias. Todo lo demás se construye
 * encima de ella. Nunca lanza: si la BD falla, devuelve la última config conocida
 * (aunque esté vencida) o null — igual que hace config.ts.
 */
async function leerFila(clave: string): Promise<InstanciaConfig | null> {
  const now = Date.now();
  const hit = cache.get(clave);
  if (hit && hit.expira > now) return hit.config;

  try {
    const sql = db();
    const [row] = await sql<InstanciaConfig[]>`
      SELECT instancia, modo, max_concurrent, canal_url, canal_key_enc, activa
      FROM demo_instancias WHERE instancia = ${clave}
    `;
    const config = row ?? null;
    cache.set(clave, { config, expira: now + (await cacheInstanciasMs()) });
    return config;
  } catch (e) {
    // BD caída: servir lo último que supimos (aunque haya vencido) antes que romper.
    console.warn(`[instancias] BD no responde para '${clave}': ${(e as Error).message}`);
    return hit?.config ?? null;
  }
}

// ── GETTERS ──────────────────────────────────────────────────────────────────

/** Config completa de UNA instancia (con cache). null si no existe o la BD falla. */
export async function getInstancia(instancia: string): Promise<InstanciaConfig | null> {
  return leerFila(norm(instancia));
}

/**
 * P1 · ¿Existe esta instancia y está activa? Se valida en RUNTIME contra la BD, no
 * contra una lista fija en el código: una instancia nueva creada con un INSERT es
 * válida al instante, sin desplegar. Si la BD no responde, cae a las semillas.
 */
export async function instanciaValida(instancia: string): Promise<boolean> {
  const clave = norm(instancia);
  const cfg = await leerFila(clave);
  if (cfg) return cfg.activa;
  return (INSTANCIAS_SEMILLA as readonly string[]).includes(clave);
}

/**
 * I5b · Config de TODAS las instancias activas. Devuelve la fila completa (no solo
 * el nombre) para que quien necesite sumar cupos no tenga que volver a la BD con su
 * propio SQL — que es lo que hacía userStore, sin cache ni try/catch.
 * Si la BD falla, degrada a las semillas con su cupo de types.ts.
 */
export async function instanciasActivas(): Promise<InstanciaConfig[]> {
  try {
    const sql = db();
    const filas = await sql<InstanciaConfig[]>`
      SELECT instancia, modo, max_concurrent, canal_url, canal_key_enc, activa
      FROM demo_instancias WHERE activa = true ORDER BY instancia
    `;
    // Refresca la cache de paso: una consulta sirve para todas.
    const expira = Date.now() + (await cacheInstanciasMs());
    for (const f of filas) cache.set(f.instancia, { config: f, expira });
    if (filas.length) return filas;
  } catch (e) {
    console.warn(`[instancias] activas: BD no responde: ${(e as Error).message}`);
  }
  // Degradación: semillas con su cupo conocido.
  return INSTANCIAS_SEMILLA.map((instancia) => ({
    instancia,
    modo: instancia === "general" ? "1:M" : "1:1",
    max_concurrent: MAX_CONCURRENT[instancia] ?? 1,
    canal_url: null,
    canal_key_enc: null,
    activa: true,
  }));
}

/** Suma de los cupos de las instancias activas (lo que muestra el panel). */
export async function cupoTotalActivas(): Promise<number> {
  const filas = await instanciasActivas();
  return filas.reduce((sum, f) => sum + (f.max_concurrent ?? 0), 0);
}

/**
 * Invalida la cache de una instancia (o toda). La usará el panel admin cuando pueda
 * editar cupos/puente: sin esto el cambio tardaría hasta cacheInstanciasMs en verse.
 */
export function invalidarCache(instancia?: string): void {
  if (instancia) cache.delete(norm(instancia));
  else cache.clear();
}

/**
 * C1 · PUENTE. Devuelve { url, key } para hablar con una instancia, o null si no
 * tiene canal configurado. La key sale CIFRADA de la BD y se descifra aquí: nunca
 * en claro en la BD, nunca en el cliente.
 *
 * I3 · La URL sale TAL CUAL de la BD. Antes se recalculaba en código con un
 * `if (instancia === "general")` para decidir si la ruta llevaba `/i/<nombre>` —
 * un nombre con dueño hardcodeado, justo lo que prohíbe la regla del default
 * peligroso. La BD ya guarda la ruta completa y correcta de cada instancia
 * (general va sin `/i/`), así que no hay nada que recalcular.
 *
 * I4a · Se retiró el fallback a env vars (FOR3S_INST_… / FOR3S_GENERAL_…): las 4
 * instancias tienen canal_url + canal_key_enc en la BD (verificado E2E 2026-07-26,
 * las 4 responden HTTP 200), así que el fallback ya no protegía ningún caso. Si una
 * instancia no tiene canal, devolver null es una falla CLARA — mejor que apuntar a
 * un canal ajeno, que daría 401 y parecería un problema de red.
 */
export async function canalDe(
  instancia: string,
): Promise<{ url: string; key: string } | null> {
  const cfg = await leerFila(norm(instancia));
  if (!cfg?.canal_url || !cfg.canal_key_enc) return null;
  try {
    return { url: cfg.canal_url, key: decryptSecret(cfg.canal_key_enc) };
  } catch (e) {
    // Blob corrupto o DEMO_ENC_KEY equivocada: no hay canal utilizable.
    console.warn(
      `[instancias] canal_key_enc de '${cfg.instancia}' no descifra: ${(e as Error).message}`,
    );
    return null;
  }
}

/**
 * C3 · CUPO. max_concurrent de la instancia desde la BD (con cache).
 * Fallback al mapa de types.ts solo si la instancia no está en la BD.
 */
export async function cupoDe(instancia: string): Promise<number> {
  const clave = norm(instancia);
  const cfg = await leerFila(clave);
  if (cfg && cfg.max_concurrent > 0) return cfg.max_concurrent;
  return MAX_CONCURRENT[clave as DemoKind] ?? 1;
}
