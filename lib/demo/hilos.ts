// Nombre del HILO de una persona — UN solo lugar que decide cómo se llama.
//
// Problema que resuelve (hallazgo 2026-07-25): el nombre del hilo se derivaba del
// NOMBRE de la persona en 3 sitios distintos (`"hilo-" + name.replace(...)`), así que
// dos personas distintas con el mismo nombre ("Ana García" y "Ana Gómez") caían en el
// MISMO hilo dentro de una instancia → se pisaban la conversación.
//
// Estándar (Brian 2026-07-25):
//   • DUEÑO     → hilo `general` (el hilo base de su agente; su memoria de siempre).
//   • INVITADO  → `hilo-<slug-del-nombre>-<sufijo-del-correo>`: legible para que el
//     dueño identifique quién es, y ÚNICO porque el sufijo sale del correo (identidad
//     real). Dos "ana" distintas → hilo-ana-3f9c2a1b y hilo-ana-77de041c.
//
// El sufijo usa el MISMO hash del correo que el X-Client-Id del agente
// (sha256 → hex), para que web y agente hablen de la misma identidad.

import { createHash } from "node:crypto";

/** Hilo base del dueño: su memoria de siempre en su agente. */
export const HILO_DUENO = "general";

/** Slug legible del nombre (sin acentos ni símbolos), acotado para no crecer. */
function slugNombre(nombre: string): string {
  return (
    (nombre || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // quita acentos
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "invitado"
  );
}

/** Sufijo estable y único derivado del correo (misma base que el X-Client-Id). */
function sufijoCorreo(email: string): string {
  return createHash("sha256")
    .update((email || "").trim().toLowerCase())
    .digest("hex")
    .slice(0, 8);
}

/**
 * Nombre del hilo de una persona. ÚNICO por correo, legible por el nombre.
 * @param rol   'dueno' → hilo base 'general'; cualquier otro → hilo propio aislado.
 */
export function nombreDeHilo(
  rol: string,
  nombre: string,
  email: string,
): string {
  if (rol === "dueno") return HILO_DUENO;
  return `hilo-${slugNombre(nombre)}-${sufijoCorreo(email)}`;
}
