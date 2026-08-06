/**
 * CAMINO ④ · APAGAR — solo el DUEÑO apaga su agente.
 *
 * Plan: Mente/blocks/archive/plan-tests-demo_2026-08/docs/plan-critical-paths.md §2
 * Criterio: Mente/principles/expertise/val-functional.md §2.2 y §2.3
 *
 * ⚠️ CORRECCIÓN AL PLAN, medida antes de escribir (2026-08-05):
 * el plan apuntaba a `lib/demo/container.ts`. **La autorización NO vive ahí.**
 * `container.ts` solo encola la intención; la regla *"solo el dueño"* se hace cumplir
 * en `app/api/demo/general/agent/route.ts` (líneas 32-39), contra `demo_duenos`.
 * Un test contra `container.ts` habría dado verde sin tocar la regla que importa —
 * el peor resultado posible: cobertura que tranquiliza sin proteger.
 *
 * Este archivo prueba lo que SE PUEDE probar sin red ni BD, y declara con precisión
 * lo que no. `val-functional.md` §2.2: *un check que no puede fallar se borra*.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { containerName } from "@/lib/demo/types";
import { setContainerRunning } from "@/lib/demo/container";

const LIMPIO = { ...process.env };
beforeEach(() => { process.env = { ...LIMPIO }; });
afterEach(() => { process.env = { ...LIMPIO }; });

describe("④ apagar · a QUÉ contenedor apunta la orden", () => {
  /**
   * El apagado nombra un contenedor. Si dos instancias distintas produjeran el mismo
   * nombre, apagar la propia apagaría la ajena — la misma familia de bug que la
   * colisión de ids del camino ③, pero con consecuencia física: el agente de otro
   * dueño se cae.
   */
  it("instancias distintas → contenedores DISTINTOS", () => {
    // ⚠️ Los nombres llevan PREFIJO COMÚN a propósito: "brian" y "brian-2" comparten
    // los 6 primeros caracteres, y "jazz"/"jazz-old" también. Si el nombre se truncara
    // o se derivara de una inicial, esos pares colisionarían — y ese es justo el caso
    // que hay que cazar, no el de cuatro instancias que ya empiezan por letras
    // distintas. (Medido 2026-08-05: con ["jazz","mashe","brian","general"] un
    // sabotaje que truncaba a 1 carácter NO ponía este test en rojo.)
    const instancias = ["jazz", "jazz-old", "brian", "brian-2", "general"];
    const nombres = instancias.map(containerName);
    expect(new Set(nombres).size).toBe(instancias.length);
  });

  it("el nombre lleva el prefijo y termina en la instancia — nunca es el nombre pelado", () => {
    // Un nombre sin prefijo podría chocar con un contenedor ajeno del mismo host.
    const n = containerName("jazz");
    expect(n).not.toBe("jazz");
    expect(n.endsWith("jazz")).toBe(true);
  });
});

describe("④ apagar · el contrato del despacho asíncrono", () => {
  /**
   * ⭐ EL CONTRATO QUE ESTE TEST SUJETA (modelo C, 2026-07-26).
   *
   * `setContainerRunning` devuelve `true` SOLO si la orden se aplicó de forma
   * síncrona. En producción eso nunca pasa: la orden viaja por la BD y `for3s-ctl`
   * la ejecuta en su siguiente ciclo (~5-15s). El endpoint expone ese booleano como
   * `aplicado`, y la UI lo usa para decir "encendiendo…" en vez de fingir éxito.
   *
   * 🔴 Por qué importa que sea FALSE y no true: el NO-OP viejo devolvía éxito
   * inmediato y el usuario veía "apagado" mientras el agente seguía vivo. Un control
   * que miente sobre el estado es el defecto que `dev-frontend.md` §2 prohíbe.
   */
  it("sin URL de control directo devuelve FALSE — 'en camino', no 'hecho'", async () => {
    delete process.env.DEMO_AGENT_CONTROL_URL;
    expect(await setContainerRunning("jazz", false)).toBe(false);
    expect(await setContainerRunning("jazz", true)).toBe(false);
  });

  it("🔴 en producción la vía HTTP directa NO debe estar configurada", () => {
    // `DEMO_AGENT_CONTROL_URL` apunta al plano ADMIN (tailnet-only, dual-plane R10).
    // Si apareciera en el entorno de Vercel, el plano admin quedaría alcanzable desde
    // internet — la opción A que Brian descartó explícitamente (container.ts:9-11).
    // Este check vale en cualquier entorno donde corran los tests: si alguien la
    // define "para probar", queda constancia en rojo.
    expect(process.env.DEMO_AGENT_CONTROL_URL).toBeUndefined();
  });

  it("un fallo de red NO revienta — la orden ya está en la BD", async () => {
    // Se apunta a un puerto cerrado a propósito: el fetch falla de verdad, sin mock.
    // El contrato es que devuelva false y no lance, porque el estado real ya se
    // persistió antes de llamar aquí (route.ts:46 → setAgentState).
    process.env.DEMO_AGENT_CONTROL_URL = "http://127.0.0.1:1";
    await expect(setContainerRunning("jazz", false)).resolves.toBe(false);
  });
});

/**
 * ⬜ LO QUE ESTE ARCHIVO NO PRUEBA — declarado, no escondido.
 *
 * La regla *"un invitado con llave válida recibe 403"* vive en el endpoint y necesita
 * sesión (`next/headers`) + `demo_duenos` (Postgres). Con la rama de Neon de test se
 * escribe como test de integración; sin ella, un mock probaría el mock
 * (`val-functional.md` §2.3).
 *
 * ⚠️ Además, el ORDEN de los dos 403 es parte del contrato y también queda pendiente:
 * `paid_only` (modo ≠ 1:1) se evalúa ANTES que `solo_el_dueno`. Invertirlos filtraría
 * quién es dueño de qué instancia a cualquiera que sondee el endpoint.
 *
 * Anotado en `blocks/active/demo` §F-8.
 */
