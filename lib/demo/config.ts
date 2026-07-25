// Parámetros operativos de la demo — leídos de demo_config (Neon), NO del código.
//
// Brian 2026-07-25: "esos valores deberían estar en la base de datos y poder
// modificarlos desde ahí, para no hacer un push cada vez". Cambiar un parámetro =
// UPDATE en demo_config → surte efecto en ≤ cacheTTL, sin redeploy ni GitHub.
//
// Cada getter trae un default de seguridad: si la BD no responde o falta la clave,
// el sistema sigue funcionando con el valor previo (nunca rompe por config).

import { db } from "./db";

const CACHE_MS = 10_000; // cache del propio config (fijo y corto a propósito)
let cache: { valores: Map<string, string>; expira: number } | null = null;

/** Lee toda la config (con cache corta). Si falla la BD, devuelve mapa vacío. */
async function leerConfig(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cache && cache.expira > now) return cache.valores;
  try {
    const sql = db();
    const filas = await sql<{ clave: string; valor: string }[]>`
      SELECT clave, valor FROM demo_config
    `;
    const valores = new Map(filas.map((f) => [f.clave, f.valor]));
    cache = { valores, expira: now + CACHE_MS };
    return valores;
  } catch {
    return cache?.valores ?? new Map();
  }
}

/** Invalida la cache (tras un UPDATE administrativo). */
export function invalidarConfig(): void {
  cache = null;
}

/** Valor entero de una clave, con default si no existe o es inválido. */
export async function configInt(clave: string, porDefecto: number): Promise<number> {
  const v = (await leerConfig()).get(clave);
  const n = v === undefined ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
}

/** Valor de texto de una clave, con default. */
export async function configTexto(clave: string, porDefecto: string): Promise<string> {
  return (await leerConfig()).get(clave) ?? porDefecto;
}

// ── Getters con nombre (lo que usa el resto del código) ──
/** Segundos sin latido antes de liberar el cupo (reapStale). */
export const sesionTtlMs = async () => (await configInt("sesion_ttl_seg", 60)) * 1000;
/** Segundos de cache de la config de instancias. */
export const cacheInstanciasMs = async () => (await configInt("cache_config_seg", 10)) * 1000;
/** Milisegundos de validez del código de verificación. */
export const codigoValidezMs = async () => (await configInt("codigo_validez_min", 10)) * 60_000;
/** Intentos permitidos antes de bloquear el código. */
export const codigoMaxIntentos = async () => configInt("codigo_max_intentos", 5);
/** Cómo calcula el panel el cupo: 'suma' (todas las instancias) | 'general'. */
export const panelCupoModo = async () => configTexto("panel_cupo_modo", "suma");
