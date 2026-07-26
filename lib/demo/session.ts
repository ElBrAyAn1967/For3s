// ⭐ LA puerta de la SESIÓN de la demo: quién eres y en calidad de qué.
//
// Todas las cookies son httpOnly: el JS del cliente no las puede leer ni falsificar.
//
// ── FORMA BASE (refactor 2026-07-26 · S1-S3) ─────────────────────────────────
// Este archivo guardaba/leía cookies, pero empujaba trabajo a sus consumidores: el
// guardia "¿hay sesión? si no, 401" estaba COPIADO 12 veces en 11 rutas, en dos
// estilos distintos, y el `kind` de la cookie se usaba sin validar (7 `as DemoKind`).
// Ahora este módulo responde entero a la pregunta de sesión:
//
//   S1 · `requireSession()` — el guardia, en UN solo lugar.
//   S2 · el `kind` de la cookie se VALIDA contra demo_instancias al leerlo.
//   S3 · un solo parser de cookie (`leerPar`), no uno por cookie.
//
// ── POR QUÉ VALIDAR EL `kind` (S2) ──────────────────────────────────────────
// La cookie de correo dura 30 días y lleva dentro el nombre de la instancia. Si esa
// instancia se renombra o se desactiva en Neon, la cookie sigue diciendo el nombre
// viejo — y 7 rutas lo usaban como verdad para guardar la API key, el heartbeat o el
// perfil. Ese es el patrón "cookie kind ≠ instancia real" que ya obligó a un barrido
// completo (commit b61e3d0): aquel barrido arregló los consumidores, pero la raíz
// seguía aquí. Ahora la degradación ocurre en UN sitio, no en siete.
//
// P5 · Se retiró la cookie `for3s_demo_sid` (cookie_id opaco por navegador): era la
// identidad del diseño viejo, cuya PK vivía en demo_sessions — tabla eliminada en F5.
// La identidad real hoy es el CORREO + la verificación de dueño.

import { cookies } from "next/headers";
import { instanciaValida } from "./instancias";

const EMAIL_COOKIE = "for3s_demo_email"; // "kind:email"     — quién eres (30 días)
const DUENO_COOKIE = "for3s_demo_dueno"; // "instancia:email" — probaste ser dueño (12h)

export interface DemoSession {
  kind: string; // instancia donde vive esta persona (validada contra la BD)
  email: string;
}

// ── S3 · parser único ────────────────────────────────────────────────────────

/**
 * Lee una cookie con formato "<a>:<b>" y devuelve sus dos partes. Antes este mismo
 * parseo estaba escrito dos veces (una por cookie), palabra por palabra.
 * Se corta en el PRIMER ':' porque el correo puede contenerlo, el nombre no.
 */
async function leerPar(nombre: string): Promise<{ a: string; b: string } | null> {
  const raw = (await cookies()).get(nombre)?.value;
  if (!raw) return null;
  const i = raw.indexOf(":");
  if (i <= 0) return null; // sin ':' o con parte izquierda vacía → cookie inservible
  const a = raw.slice(0, i).trim();
  const b = raw.slice(i + 1).trim();
  return a && b ? { a, b } : null;
}

/** Opciones comunes de las cookies de sesión (un solo lugar). */
function opcionesCookie(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

// ── Sesión de la persona (correo + instancia) ────────────────────────────────

export async function setDemoEmail(email: string, kind: string): Promise<void> {
  const store = await cookies();
  // 30 días — para "continuar donde se quedó".
  store.set(EMAIL_COOKIE, `${kind}:${email}`, opcionesCookie(60 * 60 * 24 * 30));
}

/**
 * Sesión actual, o null si no hay. El `kind` viene de la cookie pero se COMPRUEBA
 * contra demo_instancias (S2): si esa instancia ya no existe o se desactivó, se cae
 * a 'general' — una instancia fantasma no debe decidir dónde se guarda una API key.
 * `instanciaValida` no lanza aunque Neon esté caído (degrada a las semillas).
 */
export async function readDemoSession(): Promise<DemoSession | null> {
  const par = await leerPar(EMAIL_COOKIE);
  if (!par) return null;
  const kind = par.a.toLowerCase();
  if (!(await instanciaValida(kind))) {
    console.warn(`[session] instancia '${kind}' de la cookie ya no es válida (${par.b}) → general`);
    return { kind: "general", email: par.b };
  }
  return { kind, email: par.b };
}

export async function clearDemoEmail(): Promise<void> {
  (await cookies()).delete(EMAIL_COOKIE);
}

// ── S1 · EL guardia ──────────────────────────────────────────────────────────

/**
 * ⭐ "Esta ruta exige sesión." Devuelve la sesión, o la respuesta 401 ya armada.
 *
 * Antes cada ruta repetía el mismo bloque (12 copias, en dos estilos distintos):
 *     const sess = await readDemoSession();
 *     if (!sess) return Response.json({ error: "no_session" }, { status: 401 });
 * Ahora son dos líneas y el contrato del 401 se toca en un solo sitio:
 *     const { sess, error } = await requireSession();
 *     if (error) return error;
 *
 * NOTA: quien NO quiera rechazar (logout, que debe responder ok sin sesión) sigue
 * usando `readDemoSession()` directamente. El guardia es para las rutas que exigen.
 */
export async function requireSession(): Promise<
  { sess: DemoSession; error: null } | { sess: null; error: Response }
> {
  const sess = await readDemoSession();
  if (!sess) {
    return {
      sess: null,
      error: Response.json({ error: "no_session" }, { status: 401 }),
    };
  }
  return { sess, error: null };
}

// ── Verificación de dueño (Ronda F0 Pieza 2) ─────────────────────────────────
// Tras acertar el código, marca que ESTE correo probó ser dueño de ESTA instancia.
// El enrutador del chat lo lee para mandarlo a su instancia — y CRUZA el correo con
// el de la sesión antes de confiar (chat/route.ts), así la cookie sola no basta.

export async function setDuenoVerificado(email: string, instancia: string): Promise<void> {
  const store = await cookies();
  // 12h — se re-verifica al día siguiente.
  store.set(DUENO_COOKIE, `${instancia}:${email}`, opcionesCookie(60 * 60 * 12));
}

/** { instancia, email } si el dueño está verificado en esta sesión, o null. */
export async function readDuenoVerificado(): Promise<{
  instancia: string;
  email: string;
} | null> {
  const par = await leerPar(DUENO_COOKIE);
  return par ? { instancia: par.a.toLowerCase(), email: par.b } : null;
}

export async function clearDuenoVerificado(): Promise<void> {
  (await cookies()).delete(DUENO_COOKIE);
}
