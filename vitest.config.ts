import { defineConfig } from "vitest/config";
import path from "node:path";
import fs from "node:fs";

// Tests para los caminos críticos de la demo.
// Plan: Mente/blocks/archive/plan-tests-demo_2026-08/docs/plan-critical-paths.md
// Cómo se corren: Mente/blocks/active/demo/docs/como-correr-los-tests.md
//
// ⚠️ El alias `@/*` es obligatorio: tsconfig.json lo declara y sin él los imports de
// `lib/demo/*` no resuelven dentro del runner. Medido antes de escribir el primer test.

// ── 🔑 LA BASE DE TEST ───────────────────────────────────────────────────────
// 🔴 Vitest NO carga ningún `.env` por su cuenta (medido 2026-08-06). Sin esto, poner la
// cadena en `.env.test.local` no serviría de nada: los 13 tests de integración seguirían
// saltándose y el motivo sería invisible — el peor tipo de fallo, el que parece éxito.
//
// ⛔ Se lee SOLO `.env.test.local`, nunca `.env.local`. Esa segunda contiene
// `DEMO_DATABASE_URL`, que apunta a la Neon de PRODUCCIÓN (medido: 4 instancias vivas).
// Cargarla aquí pondría los tests a escribir en la base que sirve for3s.vercel.app.
const envTest = path.resolve(__dirname, ".env.test.local");
if (fs.existsSync(envTest)) {
  for (const linea of fs.readFileSync(envTest, "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;                       // comentarios y líneas vacías
    const valor = m[2].trim().replace(/^["']|["']$/g, "");
    if (valor && !process.env[m[1]]) process.env[m[1]] = valor;
  }
}

export default defineConfig({
  test: {
    environment: "node",           // los 4 caminos son lógica, no navegador
    include: ["tests/**/*.test.ts"],
    // Los tests de integración comparten una base: en paralelo se pisarían las filas.
    // ⚠️ En Vitest 4 esto es `fileParallelism`, NO `poolOptions.forks.singleFork` — esa
    // forma es de Vitest 3 y `tsc` la rechaza ("'poolOptions' does not exist in type").
    // Los tests corrían igual, así que solo el chequeo de tipos lo cazó (2026-08-06).
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
