/**
 * CAMINO ③ · HABLAR — mensaje → agente → respuesta EN MI HILO.
 *
 * Plan: Mente/blocks/archive/plan-tests-demo_2026-08/docs/plan-critical-paths.md §2
 * Criterio: Mente/principles/expertise/val-functional.md §2.3
 *
 * ⚠️ ESTE CAMINO CRUZA DOS FRONTERAS, no una: Postgres (para resolver la instancia y
 * el hilo) y **HTTP al agente For3s** (`fetch`). Medido antes de escribir nada.
 * Por eso el archivo está partido en dos mitades, y la línea entre ellas es la regla:
 *
 *   ① LÓGICA PURA — corre siempre. Es `clientIdDeCorreo`, y NO es un detalle: es el
 *     fix de una FUGA ENTRE USUARIOS. No toca red ni BD, así que probarla de verdad
 *     no requiere permiso de nadie.
 *   ② INTEGRACIÓN — se salta sin `DEMO_DATABASE_URL_TEST`, igual que `entrar.test.ts`.
 *     `DEMO_DATABASE_URL` es la Neon de PRODUCCIÓN (medido 2026-08-05).
 *
 * ⛔ Lo que este archivo NO hace: llamar al agente For3s de verdad. Eso enviaría un
 * mensaje real a una instancia viva y consumiría cupo de Claude. Queda declarado como
 * pendiente, no simulado con un mock: `val-functional.md` §2.3 dice que un mock de lo
 * que cruza un proceso no es prueba, y llamar a un `fetch` falso probaría el falso.
 */
import { describe, it, expect } from "vitest";
import { clientIdDeCorreo } from "@/lib/demo/for3sChat";

const URL_TEST = process.env.DEMO_DATABASE_URL_TEST;

describe("③ hablar · identidad del hablante (lógica pura)", () => {
  /**
   * 🔴 EL BUG QUE ESTA FUNCIÓN CIERRA (cazado 2026-07-20).
   *
   * El canal API sanea el `X-Client-Id` con `_limpiar_id`, que BORRA `@ . +` y trunca
   * a 32. Con correos reales eso COLISIONA personas distintas:
   *     a+b@x.com · ab.test@x.com · a.b.test@x.com  →  todos "abtestxcom"
   * Mismo id = mismo hilo y mismo vault: **una persona leía la conversación de otra.**
   * Es exactamente el fallo que el plan describe para ③ — silencioso, y el peor.
   */
  it("⭐ correos que ANTES colisionaban dan ids DISTINTOS", () => {
    const colisionaban = ["a+b@x.com", "ab.test@x.com", "a.b.test@x.com"];
    const ids = colisionaban.map(clientIdDeCorreo);
    // El bug era que los tres se reducían a la misma cadena. Un Set de 3 lo prueba.
    expect(new Set(ids).size).toBe(3);
  });

  it("el id sobrevive el saneo del agente — solo [a-z0-9], ≤32", () => {
    // Si el id llevara `@ . +` el agente los BORRARÍA y volvería la colisión; si
    // pasara de 32 lo TRUNCARÍA, que es la otra mitad del mismo bug. Este assert es
    // el contrato con `_limpiar_id`, escrito del lado que puede verificarlo.
    for (const e of ["a+b@x.com", "MUY.Largo.Correo.De.Prueba@subdominio.ejemplo.com"]) {
      const id = clientIdDeCorreo(e);
      expect(id).toMatch(/^[a-z0-9]+$/);
      expect(id.length).toBeLessThanOrEqual(32);
    }
  });

  it("el MISMO correo da SIEMPRE el mismo id — o se pierde el hilo", () => {
    // La otra cara: si el id no fuera estable, cada visita abriría un hilo nuevo y la
    // memoria del usuario desaparecería. Mayúsculas y espacios son la misma persona.
    const base = clientIdDeCorreo("brian@ejemplo.com");
    expect(clientIdDeCorreo("  BRIAN@Ejemplo.com  ")).toBe(base);
    expect(clientIdDeCorreo("brian@ejemplo.com")).toBe(base);
  });

  it("dos correos distintos NUNCA comparten id", () => {
    const a = clientIdDeCorreo("jazz@ejemplo.com");
    const b = clientIdDeCorreo("mashe@ejemplo.com");
    expect(a).not.toBe(b);
  });

  it("un correo vacío no revienta ni devuelve cadena vacía", () => {
    // Defensa: un id vacío mandaría a todos al mismo sitio, que es el bug otra vez.
    const id = clientIdDeCorreo("");
    expect(id).toMatch(/^[a-z0-9]+$/);
    expect(id.length).toBeGreaterThan(1);
  });
});

// ── ② INTEGRACIÓN — necesita base de test ────────────────────────────────────
describe.skipIf(!URL_TEST)("③ hablar · a QUÉ agente llega el mensaje (integración)", () => {
  it("un correo sin instancia expuesta FALLA CLARO — nunca cae a otro agente", async () => {
    // ⭐ La decisión que este camino protege: `chatDueno` es fail-closed. Si la
    // instancia del dueño no tiene canal, lanza `For3sChatError` de tipo "config"
    // EN VEZ de reencaminar a general. Mandar a alguien al agente equivocado es peor
    // que no responder (for3sChat.ts:19), y aquí es donde vivió ese bug.
    process.env.DEMO_DATABASE_URL = URL_TEST;
    const { chatDueno, For3sChatError } = await import("@/lib/demo/for3sChat");

    await expect(
      chatDueno("test-hablar@for3s.invalid", "instancia-que-no-existe", "hola"),
    ).rejects.toBeInstanceOf(For3sChatError);
  });
});
