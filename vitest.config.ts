import { defineConfig } from "vitest/config";
import path from "node:path";

// Tests para los caminos críticos de la demo.
// Plan: Mente/blocks/active/plan-tests-demo/docs/plan-critical-paths.md
//
// ⚠️ El alias `@/*` es obligatorio: tsconfig.json lo declara y sin él los imports de
// `lib/demo/*` no resuelven dentro del runner. Medido antes de escribir el primer test.
export default defineConfig({
  test: {
    environment: "node",           // los 4 caminos son lógica, no navegador
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
