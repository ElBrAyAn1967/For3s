// Cliente Postgres de la demo (BD `for3s_demo`).
//
// La URL viene de DEMO_DATABASE_URL. Funciona con:
//   - Postgres del server for3s (vía Tailscale) en desarrollo local.
//   - Una BD gestionada (Neon/Supabase) en producción (Vercel).
// Un único cliente por proceso (globalThis para sobrevivir hot-reload en dev).
//
// SSL: las BD gestionadas exigen TLS. Lo activamos automáticamente cuando la URL
// lo pide (sslmode=require) o cuando el host no es local — sin romper la conexión
// al server local que no usa SSL.

import postgres from "postgres";

const g = globalThis as unknown as {
  __for3sDemoSql?: ReturnType<typeof postgres>;
};

function needsSsl(url: string): boolean {
  if (/sslmode=require|sslmode=verify/.test(url)) return true;
  // Hosts locales / Tailscale no usan SSL; cualquier otro host (Neon, Supabase) sí.
  return !/@(localhost|127\.0\.0\.1|100\.\d+\.\d+\.\d+)/.test(url);
}

function create() {
  const url = process.env.DEMO_DATABASE_URL;
  if (!url) {
    throw new Error("DEMO_DATABASE_URL no configurada");
  }
  return postgres(url, {
    max: 10, // pool pequeño, suficiente para la demo
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: needsSsl(url) ? "require" : false,
  });
}

export function db() {
  if (!g.__for3sDemoSql) g.__for3sDemoSql = create();
  return g.__for3sDemoSql;
}

export function hasDb(): boolean {
  return !!process.env.DEMO_DATABASE_URL;
}