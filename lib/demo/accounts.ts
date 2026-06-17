// Resolución de cuentas/demos a partir de la URL.
//
// Jazz y Mashe se acceden por un TOKEN SECRETO impredecible en la URL
// (/demo/<token>), que actúa como contraseña. General se entra por /demo directo.
//
// FASE 1: los tokens viven aquí como seed leído de env vars (con un fallback de
// desarrollo). En Fase 2 migran a la tabla `demo_accounts` en Postgres y este
// módulo consultará la BD en vez de las env vars. El contrato (resolveByToken /
// getAccount) no cambia.

import {
  CONTAINER_NAME,
  MAX_CONCURRENT,
  type DemoAccount,
  type DemoKind,
} from "./types";

// Tokens secretos de las demos 1:1. En producción se setean por env var
// (DEMO_JAZZ_TOKEN / DEMO_MASHE_TOKEN). El fallback solo aplica en desarrollo
// local para poder probar la ruta sin configurar nada.
const DEV_FALLBACK = {
  jazz: "j-dev-only-jazz-token",
  mashe: "m-dev-only-mashe-token",
  brian: "b-pwQH4B_l0caRY16Uk1SEOU2P",
} as const;

const ENV_KEY = {
  jazz: "DEMO_JAZZ_TOKEN",
  mashe: "DEMO_MASHE_TOKEN",
  brian: "DEMO_BRIAN_TOKEN",
} as const;

type OneToOneKind = "jazz" | "mashe" | "brian";

function tokenFor(kind: OneToOneKind): string {
  return process.env[ENV_KEY[kind]] ?? DEV_FALLBACK[kind];
}

function buildAccount(kind: DemoKind): DemoAccount {
  return {
    kind,
    token: kind === "general" ? null : tokenFor(kind),
    maxConcurrent: MAX_CONCURRENT[kind],
    containerName: CONTAINER_NAME[kind],
  };
}

export function getAccount(kind: DemoKind): DemoAccount {
  return buildAccount(kind);
}

// Devuelve la cuenta 1:1 cuyo token coincide, o null si el token no existe
// (→ la página debe responder 404 para no revelar qué tokens son válidos).
export function resolveByToken(token: string): DemoAccount | null {
  for (const kind of ["jazz", "mashe", "brian"] as const) {
    if (tokenFor(kind) === token) return buildAccount(kind);
  }
  return null;
}
