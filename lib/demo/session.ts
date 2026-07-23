// Helper de cookie de sesión de demo (server-side).
//
// Identidad ligera: cada navegador recibe un cookie_id opaco. Con él el server
// rastrea "quién está activo" sin login pesado. Cookie httpOnly para que JS del
// cliente no la lea (defensa básica). En Fase 2 este id es la PK natural en
// demo_sessions.cookie_id.

import { cookies } from "next/headers";

const COOKIE_NAME = "for3s_demo_sid";

// Genera un id de sesión opaco. randomUUID está disponible en el runtime del
// server (Node/edge), a diferencia de los scripts de workflow.
function newSessionId(): string {
  return crypto.randomUUID();
}

// Lee el cookie_id existente o crea uno nuevo (y lo setea). Debe llamarse desde
// un Route Handler o Server Action (donde se pueden escribir cookies).
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = newSessionId();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
  return id;
}

// Solo lectura (para Server Components que no pueden escribir cookies).
export async function readSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

// --- Cookie de sesión de demo (correo + kind) para sesión persistente ---
// Guarda "kind:email" normalizado, para que heartbeat/logout/apikey sepan a qué
// demo y a quién se refieren sin volver a pedirlo.
const EMAIL_COOKIE = "for3s_demo_email";

export async function setDemoEmail(email: string, kind: string): Promise<void> {
  const store = await cookies();
  store.set(EMAIL_COOKIE, `${kind}:${email}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días — para "continuar donde se quedó"
  });
}

// Devuelve { kind, email } o null. Formato de la cookie: "kind:email".
export async function readDemoSession(): Promise<{
  kind: string;
  email: string;
} | null> {
  const store = await cookies();
  const raw = store.get(EMAIL_COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx < 0) return null;
  return { kind: raw.slice(0, idx), email: raw.slice(idx + 1) };
}

export async function clearDemoEmail(): Promise<void> {
  const store = await cookies();
  store.delete(EMAIL_COOKIE);
}

// --- Verificación de dueño (Ronda F0 Pieza 2) ---
// Tras acertar el código, marca en cookie httpOnly que ESTE correo probó ser
// dueño de ESTA instancia. La Pieza 3 (enrutado) lo lee para mandar el chat a la
// instancia correcta. httpOnly → el JS del cliente no la puede falsificar.
const DUENO_COOKIE = "for3s_demo_dueno";

export async function setDuenoVerificado(email: string, instancia: string): Promise<void> {
  const store = await cookies();
  store.set(DUENO_COOKIE, `${instancia}:${email}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h — se re-verifica al día siguiente
  });
}

// Devuelve { instancia, email } si el dueño está verificado en esta sesión, o null.
export async function readDuenoVerificado(): Promise<{
  instancia: string;
  email: string;
} | null> {
  const store = await cookies();
  const raw = store.get(DUENO_COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx < 0) return null;
  return { instancia: raw.slice(0, idx), email: raw.slice(idx + 1) };
}

export async function clearDuenoVerificado(): Promise<void> {
  const store = await cookies();
  store.delete(DUENO_COOKIE);
}
