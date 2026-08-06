/**
 * CAMINO ② · AUTORIZAR — un invitado NO llega a lo que no es suyo.
 *
 * Plan: Mente/blocks/archive/plan-tests-demo_2026-08/docs/plan-critical-paths.md §2
 * Criterio: Mente/principles/expertise/val-functional.md §2.3
 *
 * ── 🟢 EL AGUJERO SE CERRÓ EL 2026-08-06 ────────────────────────────────────
 * La versión anterior de este archivo tenía UN test en rojo a propósito: `allowedEmails.ts`
 * caía a un `DEV_FALLBACK` que autorizaba `jazz@example.com`, un dominio que nadie controla.
 * Su verde ERA la definición de cerrar el sub-bloque 7.
 *
 * Se cerró por la vía de fondo, no parcheando el assert: Brian borró las instancias `jazz` y
 * `mashe` del servidor (cero uso real — 4 y 8 episodios de las pruebas E2E de julio), y sin
 * instancias 1:1 legado que compatibilizar, el módulo entero perdió su razón de existir.
 * `lib/demo/allowedEmails.ts` **está borrado** y el paso "autorizado por ENV" desapareció de
 * `resolverAcceso()`.
 *
 * ⚠️ ESTE ES UN TEST DE INTEGRACIÓN, y no por gusto: las dos fuentes de verdad que quedan
 * —`demo_duenos` y `demo_llaves`— viven en Postgres. Antes se podía probar sin BD porque la
 * autorización se resolvía contra una constante en el código; **que ya no se pueda es
 * exactamente la mejora**. `val-functional.md` §2.3: donde cruza un proceso, solo cuenta el
 * sistema real.
 *
 * 🔴 Corre contra `DEMO_DATABASE_URL_TEST`, nunca `DEMO_DATABASE_URL` (esa es la Neon de
 * PRODUCCIÓN). Sin la variable, se salta — jamás cae de vuelta.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const URL_TEST = process.env.DEMO_DATABASE_URL_TEST;

// `.invalid` es un TLD que RFC 2606 reserva para que NUNCA resuelva.
const FORASTERO = "test-forastero@for3s.invalid";

describe.skipIf(!URL_TEST)("② autorizar · quién entra y en calidad de qué", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    process.env.DEMO_DATABASE_URL = URL_TEST;
    sql = postgres(URL_TEST!, { ssl: "require", max: 2 });
  });

  afterAll(async () => {
    if (sql) await sql.end();
  });

  it("⭐ un correo desconocido NO entra a una instancia 1:1", async () => {
    // El corazón del camino ②. Antes bastaba con acertar el `DEV_FALLBACK`.
    const { resolverAcceso } = await import("@/lib/demo/acceso");
    const [priv] = await sql<{ nombre: string }[]>`
      SELECT instancia AS nombre FROM demo_instancias WHERE modo = '1:1' AND activa LIMIT 1`;
    if (!priv) return;                       // sin instancias 1:1 no hay nada que negar
    const v = await resolverAcceso(priv.nombre, FORASTERO);
    expect(v.permitido).toBe(false);
  });

  it("🔴 REGRESIÓN · un correo de `example.com` ya NO autoriza a nadie", async () => {
    // EL AGUJERO QUE ESTE ARCHIVO EXISTE PARA VIGILAR.
    // `jazz@example.com` era la puerta abierta: dominio ajeno, cualquiera podía registrarlo.
    // Se prueba contra TODAS las instancias 1:1, no solo la que tuvo el bug.
    const { resolverAcceso } = await import("@/lib/demo/acceso");
    const privadas = await sql<{ nombre: string }[]>`
      SELECT instancia AS nombre FROM demo_instancias WHERE modo = '1:1'`;
    for (const p of privadas) {
      for (const falso of ["jazz@example.com", "mashe@example.com", "brian@example.com"]) {
        const v = await resolverAcceso(p.nombre, falso);
        expect(v.permitido, `${falso} entró a ${p.nombre}`).toBe(false);
      }
    }
  });

  it("`general` sigue abierta a propósito — y eso NO es el agujero", async () => {
    // Declarado: general es 1:M. Se prueba para que un cambio futuro lo note.
    const { resolverAcceso } = await import("@/lib/demo/acceso");
    const v = await resolverAcceso("general", FORASTERO);
    expect(v.permitido).toBe(true);
    if (v.permitido) expect(v.motivo).toBe("abierta");
  });

  it("una instancia inexistente no autoriza a nadie", async () => {
    const { resolverAcceso } = await import("@/lib/demo/acceso");
    const v = await resolverAcceso("instancia-que-no-existe", FORASTERO);
    expect(v.permitido).toBe(false);
  });

  it("un DUEÑO solo entra a SU oficina, nunca a otra", async () => {
    // La regla que causó el bug del 2026-07-25 (un dueño entrando a general).
    const { resolverAcceso } = await import("@/lib/demo/acceso");
    const [d] = await sql<{ email: string; instancia: string }[]>`
      SELECT email, instancia FROM demo_duenos LIMIT 1`;
    if (!d) return;                          // sin dueños registrados no hay nada que probar
    const suya = await resolverAcceso(d.instancia, d.email);
    expect(suya.permitido).toBe(true);
    const ajena = await resolverAcceso("general", d.email);
    expect(ajena.permitido).toBe(false);
    if (!ajena.permitido) expect(ajena.razon).toBe("es_dueno_de_otra");
  });
});
