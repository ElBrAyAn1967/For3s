/**
 * CAMINO ① · ENTRAR — verificar correo → sesión → mi instancia.
 *
 * Plan: Mente/blocks/archive/plan-tests-demo_2026-08/docs/plan-critical-paths.md §2
 * Criterio: Mente/principles/expertise/val-functional.md §2.3
 *
 * ⚠️ ESTE ES UN TEST DE INTEGRACIÓN. Habla con Postgres de verdad.
 *
 * Por qué, y no con mocks: los tres frenos de `verificacion.ts` (expiración · máx
 * intentos · espera de reenvío) NO viven en el código — viven en `demo_config` y en el
 * `ON CONFLICT` del INSERT. Un `db()` simulado probaría el simulacro, no el freno.
 * `val-functional.md` §2.3: *donde cruza un proceso o toca datos del usuario, solo
 * cuenta el sistema real*. El bug de V2 (reenviar reseteaba el contador de intentos)
 * era exactamente eso: una línea de SQL, invisible a cualquier mock.
 *
 * 🔴 CONTRA QUÉ BASE CORRE — leer antes de ejecutar:
 * `DEMO_DATABASE_URL_TEST`, **nunca** `DEMO_DATABASE_URL`. La segunda es la Neon de
 * PRODUCCIÓN que sirve for3s.vercel.app (medido 2026-08-05: 4 instancias vivas).
 * Si la variable de test falta, la suite se SALTA con un mensaje — jamás cae de vuelta
 * a producción. Un default que apunta a algo con dueño es el error de
 * `feedback_default_nunca_apunta_a_algo_con_dueno`.
 * (El hook `Mente/hooks/gate-critical.py` lo exige: un test con SQL destructivo que no
 * nombre su propia base queda BLOQUEADO al escribirlo.)
 *
 * 📧 NO envía correo: `enviarCodigo` hace el INSERT ANTES de mirar `RESEND_API_KEY`
 * (verificacion.ts:80-94). Sin esa key devuelve `correo_no_configurado` con la fila ya
 * escrita — toda la lógica de BD se ejercita, cero correos salen.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import postgres from "postgres";

const URL_TEST = process.env.DEMO_DATABASE_URL_TEST;

// El correo de prueba usa `.invalid`, un TLD que RFC 2606 reserva para que NUNCA
// resuelva. Aunque alguien configure Resend por error, no hay buzón que reciba.
const EMAIL = "test-entrar@for3s.invalid";
const INSTANCIA = "general";

// ⛔ Sin base de test no se corre. `describe.skipIf` deja constancia visible en la
// salida: un test saltado se ve, un test que no existe no. (val-functional §2.2)
describe.skipIf(!URL_TEST)("① entrar · frenos de verificación (integración)", () => {
  let sql: ReturnType<typeof postgres>;
  let maxIntentos: number;

  beforeAll(async () => {
    // La ruta de la BD del módulo bajo prueba es DEMO_DATABASE_URL. Se apunta a la
    // rama de test ANTES del primer import dinámico, que es cuando `db()` se crea.
    process.env.DEMO_DATABASE_URL = URL_TEST;
    delete process.env.RESEND_API_KEY; // ninguna prueba manda correo

    sql = postgres(URL_TEST!, { ssl: "require", max: 2 });

    // Los frenos se LEEN de la base, no se asumen. Si alguien cambia demo_config con
    // un UPDATE, este test sigue midiendo lo correcto en vez de mentir.
    const filas = await sql<{ clave: string; valor: string }[]>`
      SELECT clave, valor FROM demo_config WHERE clave = 'codigo_max_intentos'`;
    maxIntentos = Number(filas[0]?.valor ?? 5);
  });

  // Cada prueba arranca de cero. Se borra SOLO el correo de prueba, nunca por patrón:
  // un DELETE con LIKE en la tabla equivocada es cómo se pierde una fila real.
  beforeEach(async () => {
    await sql`DELETE FROM demo_verificaciones WHERE email = ${EMAIL}`;
  });

  afterAll(async () => {
    if (sql) {
      await sql`DELETE FROM demo_verificaciones WHERE email = ${EMAIL}`;
      await sql.end();
    }
  });

  it("un código pedido queda GUARDADO y HASHEADO — nunca en claro", async () => {
    const { enviarCodigo } = await import("@/lib/demo/verificacion");
    const r = await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });

    // `correo_no_configurado` es el resultado esperado sin RESEND_API_KEY, y llega
    // DESPUÉS del INSERT. Que sea un error no significa que la fila no exista.
    expect(r).toEqual({ ok: false, error: "correo_no_configurado" });

    const [fila] = await sql<{ codigo_hash: string; intentos: number; usado: boolean }[]>`
      SELECT codigo_hash, intentos, usado FROM demo_verificaciones WHERE email = ${EMAIL}`;
    expect(fila).toBeDefined();
    expect(fila.intentos).toBe(0);
    expect(fila.usado).toBe(false);
    // SHA-256 en hex: 64 caracteres. Si alguna vez guardara el código en claro serían 6.
    expect(fila.codigo_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("un código equivocado se rechaza y SUBE el contador de intentos", async () => {
    const { enviarCodigo, validarCodigo } = await import("@/lib/demo/verificacion");
    await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });

    const r = await validarCodigo(EMAIL, "000000");
    expect(r).toEqual({ ok: false, error: "incorrecto" });

    const [fila] = await sql<{ intentos: number }[]>`
      SELECT intentos FROM demo_verificaciones WHERE email = ${EMAIL}`;
    expect(fila.intentos).toBe(1);
  });

  it("al agotar los intentos configurados queda BLOQUEADO", async () => {
    const { enviarCodigo, validarCodigo } = await import("@/lib/demo/verificacion");
    await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });

    for (let i = 0; i < maxIntentos; i++) {
      expect(await validarCodigo(EMAIL, "000000")).toEqual({ ok: false, error: "incorrecto" });
    }
    // El intento siguiente ya no evalúa el código: el freno responde primero.
    expect(await validarCodigo(EMAIL, "000000")).toEqual({ ok: false, error: "bloqueado" });
  });

  it("⭐ REGRESIÓN V2 · reenviar NO reinicia el contador de intentos", async () => {
    // EL BUG QUE ESTE ARCHIVO EXISTE PARA VIGILAR.
    // El botón "reenviar código" llamaba a enviarCodigo sin límite, y su ON CONFLICT
    // hace `intentos = 0`. Sin el freno de reenvío, gastar 5 intentos y pulsar
    // reenviar devolvía el contador a cero: la fuerza bruta quedaba abierta.
    const { enviarCodigo, validarCodigo } = await import("@/lib/demo/verificacion");
    await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });

    for (let i = 0; i < maxIntentos; i++) await validarCodigo(EMAIL, "000000");
    expect(await validarCodigo(EMAIL, "000000")).toEqual({ ok: false, error: "bloqueado" });

    // Reenviar de inmediato: el freno debe negarse.
    const reenvio = await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });
    expect(reenvio).toEqual({ ok: false, error: "espera_para_reenviar" });

    // Y lo que de verdad importa: el contador NO volvió a cero.
    const [fila] = await sql<{ intentos: number }[]>`
      SELECT intentos FROM demo_verificaciones WHERE email = ${EMAIL}`;
    expect(fila.intentos).toBe(maxIntentos);
    expect(await validarCodigo(EMAIL, "000000")).toEqual({ ok: false, error: "bloqueado" });
  });

  it("un código EXPIRADO se rechaza aunque sea el correcto", async () => {
    const { enviarCodigo, validarCodigo } = await import("@/lib/demo/verificacion");
    await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });

    // Se envejece la fila en la BD en vez de esperar 10 minutos reales. Es el sistema
    // real el que decide: la comparación de expira_at ocurre en el código bajo prueba.
    await sql`UPDATE demo_verificaciones SET expira_at = now() - interval '1 minute'
              WHERE email = ${EMAIL}`;
    expect(await validarCodigo(EMAIL, "123456")).toEqual({ ok: false, error: "expirado" });
  });

  it("sin código pedido, validar responde no_hay_codigo — no revienta", async () => {
    const { validarCodigo } = await import("@/lib/demo/verificacion");
    expect(await validarCodigo(EMAIL, "123456")).toEqual({ ok: false, error: "no_hay_codigo" });
  });

  it("el freno de reenvío deja pasar cuando el código ya se USÓ", async () => {
    // Matiz del contrato: el freno solo aplica a un código VIGENTE y SIN USAR
    // (verificacion.ts:73). Quien ya entró debe poder pedir otro sin esperar.
    const { enviarCodigo } = await import("@/lib/demo/verificacion");
    await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });
    await sql`UPDATE demo_verificaciones SET usado = true WHERE email = ${EMAIL}`;

    const r = await enviarCodigo({ email: EMAIL, instancia: INSTANCIA });
    expect(r).not.toEqual({ ok: false, error: "espera_para_reenviar" });
  });
});
