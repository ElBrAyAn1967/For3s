// POST /api/demo/check-dueno — ¿este correo es dueño de alguna instancia?
// Ronda F0 Pieza 1: el sitio llama esto al entrar la demo, ANTES de registrar,
// para decidir la ruta:
//   - es dueño (brian/jazz/mashe) → { dueno: true, instancia, nombre }
//     → el sitio dispara verificación por código (Pieza 2) antes de enrutar.
//   - no es dueño → { dueno: false } → demo General normal, sin fricción.
//
// NO registra ni da acceso: solo consulta. El flujo de General queda intacto.
// Público (no revela secretos): solo dice si un correo mapea a una instancia.
//
// ⚠️ ¿POR QUÉ POST SI ES UNA CONSULTA? (decisión Brian 2026-07-25, O-F7)
// Semánticamente esto es una lectura (safe + idempotente) y en Next SOLO los GET
// son cacheables, así que un GET sería "más correcto" y cacheable. Se queda en
// POST A PROPÓSITO: con GET el CORREO viajaría en la query string y quedaría en
// los logs de Vercel/CDN y en el historial del navegador — es un dato personal.
// La ganancia de caché era marginal (se llama una vez al entrar, no en bucle), así
// que la privacidad pesa más. NO "corregir" a GET sin resolver antes eso.
// (HTTP QUERY, que resolvería este caso, no lo soporta Next 16 → responde 405.)

import { instanciaDe } from "@/lib/demo/duenos";
import { normalizeEmail, isValidEmail } from "@/lib/demo/normalize";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(body.email ?? "");
  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "correo_invalido" }, { status: 400 });
  }

  const dueno = await instanciaDe(email);
  if (!dueno) {
    return Response.json({ dueno: false });
  }
  // Es dueño: devuelve a qué instancia + nombre (para la UI). NO da acceso todavía
  // — eso pasa tras la verificación por código (Pieza 2).
  return Response.json({ dueno: true, instancia: dueno.instancia, nombre: dueno.nombre });
}
