// Store de capacidad y lista de espera de las demos.
//
// FASE 1: implementación IN-MEMORY (un Map en el proceso del server Next).
// Es suficiente para construir y probar toda la lógica de estados/cola sin
// levantar Postgres. El contrato (join/leave/heartbeat/status) está diseñado
// para que en Fase 2 se reemplace el Map por queries a la BD `for3s_demo`
// (tablas demo_sessions / demo_accounts) sin cambiar quién lo llama.
//
// Reglas:
//  - General: máx 10 'active' a la vez. El 11º entra 'waiting' con posición.
//  - Jazz/Mashe: máx 1 'active' (1:1). No usan cola realmente (cupo es suyo).
//  - Sesión inactiva > SESSION_TTL_MS se considera liberada (libera su cupo).

import { MAX_CONCURRENT, type DemoKind, type SessionStatus } from "./types";

// Tras este tiempo sin heartbeat, la sesión se da por abandonada y libera cupo.
const SESSION_TTL_MS = 60_000;

interface Session {
  cookieId: string;
  kind: DemoKind;
  status: SessionStatus;
  lastSeen: number;
  joinedAt: number;
}

// Map global. En dev, Next puede recargar módulos; lo colgamos de globalThis
// para que el estado sobreviva al hot-reload y no se "reinicie" la cola.
const globalForDemo = globalThis as unknown as {
  __for3sDemoStore?: Map<string, Session>;
};
const sessions: Map<string, Session> =
  globalForDemo.__for3sDemoStore ?? new Map();
if (!globalForDemo.__for3sDemoStore) {
  globalForDemo.__for3sDemoStore = sessions;
}

// Marca como 'released' a las sesiones que no dieron señales de vida.
// `now` se inyecta para mantener la función determinista y testeable
// (los scripts de workflow no pueden usar Date.now(), pero el server sí).
function reapStale(now: number): void {
  for (const s of sessions.values()) {
    if (s.status !== "released" && now - s.lastSeen > SESSION_TTL_MS) {
      s.status = "released";
    }
  }
}

function activeCount(kind: DemoKind): number {
  let n = 0;
  for (const s of sessions.values()) {
    if (s.kind === kind && s.status === "active") n++;
  }
  return n;
}

// Cola FIFO de los que esperan, ordenada por llegada.
function waitingQueue(kind: DemoKind): Session[] {
  return [...sessions.values()]
    .filter((s) => s.kind === kind && s.status === "waiting")
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

// Promueve al primero de la cola si hay cupo libre. Se llama tras cada salida.
function promoteIfPossible(kind: DemoKind): void {
  const max = MAX_CONCURRENT[kind];
  const queue = waitingQueue(kind);
  let free = max - activeCount(kind);
  for (const s of queue) {
    if (free <= 0) break;
    s.status = "active";
    free--;
  }
}

export interface JoinResult {
  status: SessionStatus;
  position: number | null;
  activeCount: number;
  maxConcurrent: number;
}

// Intenta ocupar un cupo. Si hay lugar → 'active'. Si está lleno → 'waiting'.
export function join(cookieId: string, kind: DemoKind, now: number): JoinResult {
  reapStale(now);
  const max = MAX_CONCURRENT[kind];

  let s = sessions.get(cookieId);
  if (!s) {
    s = { cookieId, kind, status: "ready", lastSeen: now, joinedAt: now };
    sessions.set(cookieId, s);
  }
  s.lastSeen = now;

  // Si ya está activo o esperando, devolvemos su estado actual (idempotente).
  if (s.status === "active") {
    return status(cookieId, kind, now);
  }

  if (activeCount(kind) < max) {
    s.status = "active";
  } else {
    s.status = "waiting";
    s.joinedAt = now; // su lugar en la cola se fija al momento de esperar
  }
  return status(cookieId, kind, now);
}

// Libera el cupo y promueve a la cola.
export function leave(cookieId: string, kind: DemoKind, now: number): void {
  const s = sessions.get(cookieId);
  if (s) s.status = "released";
  reapStale(now);
  promoteIfPossible(kind);
}

// Latido: mantiene viva la sesión activa/en-espera.
export function heartbeat(cookieId: string, kind: DemoKind, now: number): JoinResult {
  const s = sessions.get(cookieId);
  if (s) s.lastSeen = now;
  reapStale(now);
  promoteIfPossible(kind); // por si un cupo se liberó por TTL
  return status(cookieId, kind, now);
}

// Estado actual de una sesión, con su posición en cola si aplica.
export function status(cookieId: string, kind: DemoKind, now: number): JoinResult {
  reapStale(now);
  const s = sessions.get(cookieId);
  const max = MAX_CONCURRENT[kind];
  const active = activeCount(kind);

  if (!s || s.status === "released") {
    return { status: "released", position: null, activeCount: active, maxConcurrent: max };
  }

  let position: number | null = null;
  if (s.status === "waiting") {
    position = waitingQueue(kind).findIndex((q) => q.cookieId === cookieId) + 1;
  }
  return { status: s.status, position, activeCount: active, maxConcurrent: max };
}
