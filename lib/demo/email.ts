// Envío de email — STUB por ahora.
//
// Cuando un usuario en lista de espera consigue cupo, se le "notifica" por correo.
// Hoy NO mandamos correo real: registramos el evento y marcamos al usuario como
// notificado. Cuando haya RESEND_API_KEY, se reemplaza el cuerpo por una llamada
// real a Resend con un cambio mínimo (la firma no cambia).

import { markNotified } from "./userStore";
import type { DemoKind } from "./types";

export async function notifySpotAvailable(
  kind: DemoKind,
  email: string,
  name: string,
): Promise<void> {
  // TODO(Fase 2): reemplazar por Resend.
  console.info(
    `[demo-email STUB] (${kind}) Notificar cupo disponible → ${email} (${name})`,
  );
  await markNotified(kind, email);
}
