// C5 · Telemetría — registra eventos en demo_eventos (tabla conectada, F5).
//
// "Ver qué está pasando": cada momento importante (entrar, verificar, chatear,
// salir) deja un evento. Antes NADIE registraba nada (la tabla existía vacía).
//
// Principio: la telemetría NUNCA rompe el flujo. Si el INSERT falla, se traga el
// error (solo un console.warn) — perder un evento de auditoría no debe tumbar un
// registro/chat. Por eso registrarEvento() no lanza y no se espera con throw.

import { db } from "./db";

export type TipoEvento =
  | "register" // alguien entra / continúa
  | "verify" // dueño verificó su código
  | "chat" // mensaje al agente
  | "logout" // salida explícita
  | "waitlist"; // quedó en cola

interface EventoInput {
  tipo: TipoEvento;
  instancia?: string | null;
  email?: string | null; // se usa para resolver user_id (opcional)
  detalle?: Record<string, unknown>;
}

/**
 * Registra un evento en demo_eventos. Resuelve user_id por (instancia,email) si se
 * dan ambos. NO lanza: si algo falla, lo traga (la telemetría no rompe el flujo).
 */
export async function registrarEvento(ev: EventoInput): Promise<void> {
  try {
    const sql = db();
    const instancia = ev.instancia?.trim().toLowerCase() ?? null;
    const email = ev.email?.trim().toLowerCase() ?? null;

    // user_id: solo si tenemos instancia + email y la persona existe.
    let userId: string | null = null;
    if (instancia && email) {
      const [u] = await sql<{ id: string }[]>`
        SELECT id FROM demo_users
        WHERE instancia = ${instancia} AND lower(email) = ${email}
        LIMIT 1
      `;
      userId = u?.id ?? null;
    }

    // JSON.stringify → jsonb (evita el tipo estricto de sql.json). El cast lo hace PG.
    await sql`
      INSERT INTO demo_eventos (user_id, instancia, tipo, detalle)
      VALUES (${userId}, ${instancia}, ${ev.tipo}, ${JSON.stringify(ev.detalle ?? {})}::jsonb)
    `;
  } catch (e) {
    // Perder un evento no debe tumbar la operación principal.
    console.warn("[demo-eventos] no se pudo registrar el evento:", (e as Error).message);
  }
}
