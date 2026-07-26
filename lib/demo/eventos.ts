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
  | "waitlist" // quedó en cola
  | "byok" // conectó su propia API key de Claude
  | "agente"; // el DUEÑO pidió encender/apagar su agente

interface EventoInput {
  tipo: TipoEvento;
  instancia?: string | null;
  email?: string | null; // se usa para resolver user_id (opcional)
  detalle?: Record<string, unknown>;
}

/**
 * Registra un evento en demo_eventos. NO lanza: si algo falla, lo traga (la
 * telemetría no rompe el flujo).
 *
 * 🐛 BUG CERRADO (2026-07-26) · la persona se ubica por CORREO, no por (instancia,email).
 * Antes se buscaba con la instancia que pasaba el llamador — que en /register es el
 * `kind` de la petición ('general'), mientras el DUEÑO vive en `instancia='brian'`.
 * Resultado: el SELECT no encontraba a nadie y se insertaban eventos con **user_id
 * NULL** (9 de 9 registros medidos), perdiendo la trazabilidad de quién entró.
 *
 * Es el mismo patrón "cookie kind ≠ instancia real" que ya obligó al barrido b61e3d0
 * y que S2 atacó en session.ts: sobrevivía aquí. La regla del barrido es "ubicar a la
 * persona por CORREO — su instancia real manda", y eso es lo que se aplica ahora.
 *
 * La instancia del evento también sale de dónde vive REALMENTE la persona; la que
 * pasa el llamador queda solo como respaldo (para eventos sin persona conocida, p.ej.
 * un registro que aún no creó fila). Así el llamador ya no tiene que resolverla por su
 * cuenta antes de llamar, como hacía chat/route.ts.
 */
export async function registrarEvento(ev: EventoInput): Promise<void> {
  try {
    const sql = db();
    const instanciaDicha = ev.instancia?.trim().toLowerCase() ?? null;
    const email = ev.email?.trim().toLowerCase() ?? null;

    // La identidad es el CORREO. Si la persona existe, su fila manda (id + instancia).
    let userId: string | null = null;
    let instancia = instanciaDicha;
    if (email) {
      const [u] = await sql<{ id: string; instancia: string }[]>`
        SELECT id, instancia FROM demo_users
        WHERE lower(email) = ${email}
        ORDER BY last_seen_at DESC LIMIT 1
      `;
      if (u) {
        userId = u.id;
        instancia = u.instancia ?? instanciaDicha;
      }
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
