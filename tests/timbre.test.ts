/**
 * EL TIMBRE de for3s-agente-sync (EXT-74) — lo que la web le manda a Upstash.
 *
 * Se prueba sin red: un fetch falso guarda lo que recibe y contesta lo que le pidamos.
 * Lo que importa: la llave exacta que el server escucha, que nunca lance (la orden ya
 * está en la BD), y que un error de Upstash no pase por timbre sonado.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { tocarTimbre, llaveTimbre } from "@/lib/demo/timbre";
import { setContainerRunning } from "@/lib/demo/container";

const LIMPIO = { ...process.env };
beforeEach(() => {
  process.env = { ...LIMPIO };
  delete process.env.DEMO_AGENT_CONTROL_URL;
  process.env.DEMO_BELL_REST_URL = "https://timbre.example.test/";
  process.env.DEMO_BELL_REST_TOKEN = "tok-de-prueba";
  delete process.env.DEMO_BELL_SERVER;
});
afterEach(() => { process.env = { ...LIMPIO }; });

type Visto = { url: string; auth: string | null; body: unknown };
function fetchFalso(respuesta: () => Response, vistos: Visto[]) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    vistos.push({
      url: String(url),
      auth: new Headers(init?.headers).get("authorization"),
      body: JSON.parse(String(init?.body)),
    });
    return respuesta();
  }) as typeof fetch;
}
const ok = () => Response.json([{ result: 1 }, { result: 1 }]);

describe("timbre · lo que llega a Upstash", () => {
  it("LPUSH + EXPIRE en UNA petición a /pipeline, con la llave que escucha el server", async () => {
    const vistos: Visto[] = [];
    expect(await tocarTimbre(fetchFalso(ok, vistos))).toBe(true);
    expect(vistos).toHaveLength(1);
    expect(vistos[0].url).toBe("https://timbre.example.test/pipeline");
    expect(vistos[0].auth).toBe("Bearer tok-de-prueba");
    // ⚠️ La llave es el contrato con db/demo/for3s_agente_sync.py (FOR3S_SYNC_BELL_KEY por omisión).
    expect(vistos[0].body).toEqual([["LPUSH", "demo-bell:for3s", "agent_on"], ["EXPIRE", "demo-bell:for3s", "120"]]);
  });

  it("DEMO_BELL_SERVER cambia el servidor, no el prefijo", async () => {
    process.env.DEMO_BELL_SERVER = "otro";
    const vistos: Visto[] = [];
    await tocarTimbre(fetchFalso(ok, vistos));
    expect(llaveTimbre("otro")).toBe("demo-bell:otro");
    expect((vistos[0].body as string[][])[0][1]).toBe("demo-bell:otro");
  });
});

describe("timbre · nunca rompe la petición", () => {
  it("sin configuración → false y no llama a nadie", async () => {
    delete process.env.DEMO_BELL_REST_TOKEN;
    const vistos: Visto[] = [];
    expect(await tocarTimbre(fetchFalso(ok, vistos))).toBe(false);
    expect(vistos).toHaveLength(0);
  });

  it("una URL que no es https → false y no llama a nadie (el token no viaja en claro)", async () => {
    process.env.DEMO_BELL_REST_URL = "http://timbre.example.test";
    const vistos: Visto[] = [];
    expect(await tocarTimbre(fetchFalso(ok, vistos))).toBe(false);
    expect(vistos).toHaveLength(0);
  });

  it("Upstash contesta un error dentro del 200 → false, no pasa por timbre sonado", async () => {
    const vistos: Visto[] = [];
    const conError = () => Response.json([{ result: 1 }, { error: "WRONGTYPE" }]);
    expect(await tocarTimbre(fetchFalso(conError, vistos))).toBe(false);
  });

  it("HTTP 401 → false", async () => {
    expect(await tocarTimbre(fetchFalso(() => new Response("no", { status: 401 }), []))).toBe(false);
  });

  it("la red se cae → false, sin lanzar", async () => {
    const roto = (async () => { throw new TypeError("fetch failed"); }) as typeof fetch;
    await expect(tocarTimbre(roto)).resolves.toBe(false);
  });

  it("setContainerRunning sigue diciendo aplicado=false aunque el timbre suene (la orden es asíncrona)", async () => {
    process.env.DEMO_BELL_REST_URL = "https://127.0.0.1:9"; // nadie escucha: el timbre falla rápido
    await expect(setContainerRunning("brian", true)).resolves.toBe(false);
  });
});
