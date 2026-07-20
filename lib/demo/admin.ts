// Autorización del dashboard admin de la demo.
//
// Pieza E (2026-07-20): la demo se ABSORBIÓ en el panel unificado /for3s-admin,
// que autentica con el TOKEN DE CONTROL (no con la contraseña vieja). Por eso el
// endpoint /api/demo/admin/users valida el token del panel contra el server For3s,
// server-side (el sitio corre en el tailnet, misma red que la BD for3s_demo).
//
// La contraseña vieja (DEMO_ADMIN_PASSWORD) queda como FALLBACK opcional para no
// romper nada durante la transición; se retira cuando /demo-admin ya no exista.

const FOR3S_ADMIN_BASE =
  process.env.NEXT_PUBLIC_FOR3S_ADMIN_BASE ??
  "https://for3s.tail6749e5.ts.net:8443";

// Caché en memoria de tokens ya validados (la sección Demo hace auto-refresh cada
// 5s → sin caché serían ~12 validaciones/min contra el server SOLO para autorizar).
// Guarda SOLO tokens VÁLIDOS (fail-closed nunca se cachea) y expira a los 60s.
const TOKEN_TTL_MS = 60_000;
const tokenCache = new Map<string, number>(); // token → epoch de expiración

/** Valida el TOKEN DE CONTROL del panel contra el server For3s (server-side),
 * con caché de 60s. Devuelve true solo si el server acepta el token. Cualquier
 * fallo de red/otros → false (fail-closed: sin confirmación, no autoriza; y NO
 * se cachea, para reintentar en el próximo request). */
async function tokenDeControlValido(token: string): Promise<boolean> {
  if (!token) return false;
  const ahora = Date.now();
  const expira = tokenCache.get(token);
  if (expira !== undefined) {
    if (expira > ahora) return true; // hit vigente
    tokenCache.delete(token); // venció → revalidar abajo
  }
  try {
    const res = await fetch(`${FOR3S_ADMIN_BASE}/adm/consumo/resumen?dias=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Admin-Actor": "panel-brian",
      },
      signal: AbortSignal.timeout(8000), // el tailnet responde rápido; corta si no llega
    });
    if (res.ok) {
      // poda defensiva de entradas vencidas (el admin real es 1 persona, pero
      // evita que el Map crezca sin fin si rotaran tokens). Barato: pocas entradas.
      if (tokenCache.size > 16) {
        for (const [t, exp] of tokenCache) if (exp <= ahora) tokenCache.delete(t);
      }
      tokenCache.set(token, ahora + TOKEN_TTL_MS); // solo se cachea lo VÁLIDO
      return true;
    }
    return false; // 401/otros → no cachear (fail-closed)
  } catch {
    return false; // no llego / timeout / AbortSignal.timeout ausente → fail-closed
  }
}

/** Autorización del endpoint de la demo. Pieza E: acepta el token de control del
 * panel (header Authorization: Bearer …). Fallback: la contraseña vieja, si sigue
 * configurada (transición). Fail-closed si ninguna cuadra. */
export async function isAdminAuthorized(request: Request): Promise<boolean> {
  // 1) token de control del panel (la vía nueva, "una sola llave")
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  if (bearer && (await tokenDeControlValido(bearer))) return true;

  // 2) fallback transitorio: contraseña vieja (si aún está configurada)
  const expected = process.env.DEMO_ADMIN_PASSWORD;
  if (expected && request.headers.get("x-admin-password") === expected) {
    return true;
  }
  return false;
}