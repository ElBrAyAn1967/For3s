/**
 * CAMINO ② · AUTORIZAR — un invitado NO llega a lo que no es suyo.
 *
 * Plan: Mente/blocks/active/plan-tests-demo/docs/plan-critical-paths.md §2
 * Criterio: Mente/principles/expertise/val-functional.md §2.2
 *
 * ⚠️ LEE ESTO ANTES DE "ARREGLAR" UN TEST ROJO:
 * el último bloque de este archivo (`EL AGUJERO ABIERTO`) está diseñado para FALLAR hoy.
 * No es un test roto: es el agujero de `allowedEmails.ts` documentado como criterio
 * verificable. Su VERDE es la definición de "sub-bloque 7 cerrado" en blk-demo-2026-07.
 *
 * Medido 2026-08-05: sin `DEMO_JAZZ_EMAIL` en el entorno, `DEV_FALLBACK` autoriza
 * `jazz@example.com` — una dirección falsa que nadie controla.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isEmailAllowed, allowedEmailFor } from "@/lib/demo/allowedEmails";

const LIMPIO = { ...process.env };
beforeEach(() => { process.env = { ...LIMPIO }; });
afterEach(() => { process.env = { ...LIMPIO }; });

describe("② autorizar · lo que YA protege", () => {
  it("rechaza un correo que no es el dueño", () => {
    process.env.DEMO_JAZZ_EMAIL = "jazz.real@ejemplo.com";
    expect(isEmailAllowed("jazz", "otro@ejemplo.com")).toBe(false);
  });

  it("acepta al dueño declarado por env", () => {
    process.env.DEMO_JAZZ_EMAIL = "jazz.real@ejemplo.com";
    expect(isEmailAllowed("jazz", "jazz.real@ejemplo.com")).toBe(true);
  });

  it("normaliza mayúsculas y espacios — no son dos identidades distintas", () => {
    process.env.DEMO_JAZZ_EMAIL = "jazz.real@ejemplo.com";
    expect(isEmailAllowed("jazz", "  JAZZ.REAL@Ejemplo.com  ")).toBe(true);
  });

  it("una instancia sin dueño declarado no autoriza a nadie", () => {
    // P1 del propio módulo: sin env y sin fallback devuelve "" → no autoriza.
    expect(allowedEmailFor("instancia-inexistente")).toBe("");
    expect(isEmailAllowed("instancia-inexistente" as never, "quien@sea.com")).toBe(false);
  });

  it("`general` es público a propósito — y eso NO es el agujero", () => {
    // Declarado: general no restringe. Se prueba para que un cambio futuro lo note.
    expect(isEmailAllowed("general", "cualquiera@ejemplo.com")).toBe(true);
  });
});

describe("🔴 EL AGUJERO ABIERTO · sub-bloque 7 de blk-demo-2026-07", () => {
  it("una dirección FALSA no debería autorizar cuando no hay env var", () => {
    // Sin DEMO_JAZZ_EMAIL, DEV_FALLBACK entrega jazz@example.com y ESO autoriza.
    // Ese dominio no lo controla nadie: cualquiera que lo registre entra.
    delete process.env.DEMO_JAZZ_EMAIL;
    expect(isEmailAllowed("jazz", "jazz@example.com")).toBe(false);
  });
});
