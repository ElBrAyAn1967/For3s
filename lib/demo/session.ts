// Cookies de sesión de la demo (server-side). Todas httpOnly: el JS del cliente
// no las puede leer ni falsificar.
//
// P5 · Se retiró la cookie `for3s_demo_sid` (cookie_id opaco por navegador) junto
// con getOrCreateSessionId/readSessionId: era la identidad del diseño viejo, cuya
// PK vivía en demo_sessions — tabla eliminada en F5. La identidad real hoy es el
// CORREO (cookie for3s_demo_email) + la verificación de dueño.

import { cookies } from "next/headers";

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
