// ============================================================================
// ⚠️⚠️⚠️  OAUTH DE SUSCRIPCIÓN CLAUDE — SOLO PRUEBAS INTERNAS  ⚠️⚠️⚠️
// ============================================================================
//
// ESTE FLUJO NO ES LEGAL EN PRODUCCIÓN.
//
// Usar el OAuth de suscripción de Claude (Pro/Max) en un tercero como For3s viola
// los Consumer Terms de Anthropic (vigente desde 2026-04). Riesgo: BANEO de la
// cuenta de Claude que se vincule. Casos confirmados: OpenClaw, OpenCode.
//
// Decisión explícita de Brian: habilitarlo SOLO para demos 1:1 con cuentas
// conocidas (jazz/mashe/brian), para PRUEBAS INTERNAS, con riesgo asumido.
//
// NUNCA promover a producción pública. Para usuarios reales usar:
//   - General: el usuario pega su propia API key (vía legal, ya implementada).
//   - O un acuerdo de partner formal con Anthropic.
//
// GUARD REAL: el OAuth solo se activa si la env var DEMO_OAUTH_INTERNAL=1 está
// presente. Por defecto está APAGADO → un deploy a producción sin esa var
// devuelve 403 y el botón nunca funciona, aunque el código exista.
// ============================================================================

import type { DemoKind } from "./types";

// Solo estas demos 1:1 conocidas pueden usar OAuth. General jamás.
export const OAUTH_KINDS: DemoKind[] = ["jazz", "mashe", "brian"];

// Interruptor maestro. Debe activarse a mano en el entorno de pruebas.
// Producción NO debe tener esta var → OAuth queda muerto.
export function isOAuthInternalEnabled(): boolean {
  return process.env.DEMO_OAUTH_INTERNAL === "1";
}

// ¿Se permite OAuth para este kind, en este entorno?
export function isOAuthAllowed(kind: string | undefined): boolean {
  if (!isOAuthInternalEnabled()) return false;
  return !!kind && OAUTH_KINDS.includes(kind as DemoKind);
}
