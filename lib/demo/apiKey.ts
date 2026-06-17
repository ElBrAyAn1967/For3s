// Validación de FORMATO de la API key de Anthropic.
//
// Vía legal (decidida): el usuario pega SU propia API key de console.anthropic.com.
// For3s la usa para correr con el billing del usuario. NUNCA usamos OAuth de
// suscripción de terceros (prohibido por Anthropic desde 2026-04, riesgo de baneo).
//
// FASE 1: solo validamos formato en memoria. No la mandamos a ningún lado, no la
// persistimos, no la ciframos todavía. El cifrado real (Master KEK) se enchufa
// en Fase 2 cuando conectemos al servidor for3s.

// Las API keys de Anthropic tienen prefijo "sk-ant-" seguido de un cuerpo largo.
// Mantenemos la validación deliberadamente laxa en longitud (Anthropic puede
// variar el cuerpo) pero estricta en prefijo y charset.
const ANTHROPIC_KEY_RE = /^sk-ant-[A-Za-z0-9_-]{20,}$/;

export function isValidApiKeyFormat(raw: string): boolean {
  return ANTHROPIC_KEY_RE.test(raw.trim());
}

// Hint seguro para mostrar en UI: solo los últimos 4 caracteres.
// La key completa nunca sale del momento de validación.
export function apiKeyHint(raw: string): string {
  const k = raw.trim();
  return `…${k.slice(-4)}`;
}
