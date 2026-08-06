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
//
// P6 · ⚠️ ESTA LISTA SE QUEDA FIJA A PROPÓSITO. En el resto del código las
// instancias salen de demo_instancias (cero hardcodeo), pero aquí NO: es un
// candado de seguridad. Si se leyera de la BD, cualquier instancia nueva heredaría
// el permiso de usar el OAuth de suscripción — justo lo que este guard impide.
// Añadir una instancia aquí debe ser una decisión CONSCIENTE con riesgo asumido.
// ⛔ jazz y mashe retiradas el 2026-08-06 al borrarse sus instancias. La lista sigue
// FIJA a propósito (ver arriba): añadir una instancia aquí es una decisión consciente
// con riesgo asumido, nunca algo que se herede de la BD.
export const OAUTH_KINDS: DemoKind[] = ["brian"];

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
