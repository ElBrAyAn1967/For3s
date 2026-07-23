// POST /api/demo/verify/send — envía un código de verificación al correo de un
// dueño de instancia (Ronda F0 Pieza 2). Solo se llama cuando check-dueno dijo
// que el correo ES dueño. Vuelve a comprobar aquí (no confiar en el cliente):
// si el correo NO es dueño, no envía nada (hermético).

import { enviarCodigo } from "@/lib/demo/verificacion";
import { instanciaDe } from "@/lib/demo/duenos";
import { normalizeEmail, isValidEmail } from "@/lib/demo/normalize";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(body.email ?? "");
  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "correo_invalido" }, { status: 400 });
  }

  // Re-verificar que el correo es dueño (nunca confiar en el cliente).
  const dueno = await instanciaDe(email);
  if (!dueno) {
    // No es dueño → no enviamos. Hermético: no revelamos si el correo existe.
    return Response.json({ error: "no_autorizado" }, { status: 403 });
  }

  const r = await enviarCodigo({ email, instancia: dueno.instancia, nombre: dueno.nombre });
  if (!r.ok) {
    return Response.json({ error: r.error }, { status: 502 });
  }
  // No devolvemos el código ni la instancia con detalle: solo confirmamos el envío.
  return Response.json({ ok: true, enviado_a: email });
}
