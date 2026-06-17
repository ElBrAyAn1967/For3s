// Cliente Postgres de la demo (BD dedicada for3s_demo en el server for3s).
//
// Conexión vía Tailscale (DEMO_DATABASE_URL en .env.local). Un único cliente
// reutilizado por proceso (colgado de globalThis para sobrevivir hot-reload en
// dev). Si no hay DEMO_DATABASE_URL, las funciones que lo usan deben degradar
// con gracia (el caller decide) — aquí solo exponemos el handle.

import postgres from "postgres";

const g = globalThis as unknown as {
  __for3sDemoSql?: ReturnType<typeof postgres>;
};

function create() {
  const url = process.env.DEMO_DATABASE_URL;
  if (!url) {
    throw new Error("DEMO_DATABASE_URL no configurada");
  }
  return postgres(url, {
    max: 10, // pool pequeño, suficiente para la demo
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export function db() {
  if (!g.__for3sDemoSql) g.__for3sDemoSql = create();
  return g.__for3sDemoSql;
}

export function hasDb(): boolean {
  return !!process.env.DEMO_DATABASE_URL;
}