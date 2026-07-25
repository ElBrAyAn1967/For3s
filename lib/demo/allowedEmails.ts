// Correos autorizados de las demos 1:1 (Jazz / Mashe / Brian).
//
// Cada demo 1:1 tiene UN correo fijo permitido. Solo ese correo puede entrar a
// esa demo. Llegar a la URL secreta NO basta: hay que meter el correo correcto.
//
// Los correos reales se setean por env var (no se commitean). El fallback de dev
// permite probar localmente. Comparación siempre en minúsculas (normalizado).

import type { DemoKind } from "./types";

const ENV_KEY: Record<"jazz" | "mashe" | "brian", string> = {
  jazz: "DEMO_JAZZ_EMAIL",
  mashe: "DEMO_MASHE_EMAIL",
  brian: "DEMO_BRIAN_EMAIL",
};

// Fallback SOLO para desarrollo local (reemplazar con los correos reales por env).
const DEV_FALLBACK: Record<"jazz" | "mashe" | "brian", string> = {
  jazz: "jazz@example.com",
  mashe: "mashe@example.com",
  brian: "brian@example.com",
};

// Correo autorizado para una demo 1:1 (ya normalizado a minúsculas).
// P1 · Tipo abierto: este módulo es LEGADO (correos por env var; la fuente de
// verdad es demo_duenos). Para una instancia sin env devuelve "" → no autoriza.
export function allowedEmailFor(kind: string): string {
  const envKey = ENV_KEY[kind as keyof typeof ENV_KEY];
  const fallback = DEV_FALLBACK[kind as keyof typeof DEV_FALLBACK];
  return ((envKey ? process.env[envKey] : undefined) ?? fallback ?? "")
    .trim()
    .toLowerCase();
}

// ¿Este correo está autorizado para esta demo? General no restringe (siempre ok).
export function isEmailAllowed(kind: DemoKind, email: string): boolean {
  if (kind === "general") return true;
  return allowedEmailFor(kind) === email.trim().toLowerCase();
}
