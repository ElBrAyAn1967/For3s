// ⭐ UNA sola puerta: ¿quién puede entrar y en calidad de qué?
//
// P2 · Antes había TRES fuentes de verdad para "¿este correo puede entrar?", y el
// endpoint de registro las consultaba en cascada, con la decisión repartida en dos
// bloques distintos:
//   1. allowedEmails.isEmailAllowed  → correos por ENV VAR (legado)
//   2. accountStore.esCorreoDePrivada → tabla demo_llaves
//   3. duenos.instanciaDe             → tabla demo_duenos
// De esa dispersión salieron los bugs del dueño entrando a general (2026-07-25).
//
// Ahora hay UNA función, `resolverAcceso()`, que responde con un veredicto claro.
// Quien decide qué hacer con el veredicto es el endpoint; aquí solo se resuelve
// QUIÉN es esta persona respecto a la instancia que pide.
//
// Orden de precedencia (importa):
//   DUEÑO  → manda sobre todo: solo entra a SU oficina (regla "un dueño = su oficina").
//   LLAVE  → invitado con llave privada vigente (no revocada).
//   ENV    → compatibilidad con las 1:1 legado configuradas por env var.
//   ABIERTA→ instancia 1:M (general): entra cualquiera sin fricción.

import { instanciaDe } from "./duenos";
import { esCorreoDePrivada } from "./accountStore";
import { isEmailAllowed } from "./allowedEmails";
import { getInstancia } from "./instancias";

export type MotivoAcceso =
  | "dueno" // es el dueño de ESTA instancia
  | "llave" // tiene una llave privada vigente
  | "env" // autorizado por env var (1:1 legado)
  | "abierta"; // la instancia admite a cualquiera (1:M)

export type Veredicto =
  | { permitido: true; motivo: MotivoAcceso; rol: "dueno" | "invitado" | "visitante" }
  | { permitido: false; razon: "es_dueno_de_otra"; instancia: string }
  | { permitido: false; razon: "no_autorizado" };

/**
 * ¿Puede este correo entrar a esta instancia, y como qué?
 * Fuente única de la decisión de acceso. NO registra ni da sesión: solo resuelve.
 */
export async function resolverAcceso(
  instancia: string,
  email: string,
): Promise<Veredicto> {
  const correo = email.trim().toLowerCase();
  const inst = instancia.trim().toLowerCase();

  // 1) ¿Es dueño de alguna instancia? Manda sobre todo lo demás.
  const dueno = await instanciaDe(correo);
  if (dueno) {
    // Regla "un dueño = su oficina": a la suya sí; a cualquier otra, NO (ni siquiera
    // como visitante de general). Debe verificar su código y entrar a la suya.
    return dueno.instancia === inst
      ? { permitido: true, motivo: "dueno", rol: "dueno" }
      : { permitido: false, razon: "es_dueno_de_otra", instancia: dueno.instancia };
  }

  // 2) ¿Tiene una llave privada vigente? (demo_llaves, respeta `revocada`)
  if (await esCorreoDePrivada(correo)) {
    return { permitido: true, motivo: "llave", rol: "invitado" };
  }

  // 3) Compatibilidad: 1:1 legado autorizada por env var.
  //    isEmailAllowed devuelve true para 'general', así que se comprueba aparte
  //    para no confundir "instancia abierta" con "autorizado por env".
  if (inst !== "general" && isEmailAllowed(inst, correo)) {
    return { permitido: true, motivo: "env", rol: "invitado" };
  }

  // 4) ¿La instancia es abierta (1:M)? Entonces entra cualquiera sin fricción.
  const cfg = await getInstancia(inst);
  const abierta = cfg ? cfg.modo === "1:M" : inst === "general";
  if (abierta) {
    return { permitido: true, motivo: "abierta", rol: "visitante" };
  }

  // 5) Instancia 1:1 y no es ni dueño ni tiene llave → no entra.
  return { permitido: false, razon: "no_autorizado" };
}
