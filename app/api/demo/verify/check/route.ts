// POST /api/demo/verify/check — valida el código que metió el dueño.
// Ronda F0 Pieza 2. Si acierta: marca el correo como verificado en la sesión
// (cookie httpOnly) y devuelve la instancia → la Pieza 3 enrutará su chat ahí.

import { validarCodigo } from "@/lib/demo/verificacion";
import { setDuenoVerificado } from "@/lib/demo/session";
import { normalizeEmail, isValidEmail } from "@/lib/demo/normalize";

const ERRORES: Record<string, string> = {
  no_hay_codigo: "No hay código pendiente. Pide uno nuevo.",
  expirado: "El código expiró. Pide uno nuevo.",
  bloqueado: "Demasiados intentos. Pide un código nuevo.",
  incorrecto: "Código incorrecto.",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; codigo?: string };
  const email = normalizeEmail(body.email ?? "");
  const codigo = (body.codigo ?? "").trim();
  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "correo_invalido" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(codigo)) {
    return Response.json({ error: "codigo_invalido" }, { status: 400 });
  }

  const r = await validarCodigo(email, codigo);
  if (!r.ok) {
    const status = r.error === "incorrecto" ? 401 : 409;
    return Response.json({ error: ERRORES[r.error] ?? "no_valido", code: r.error }, { status });
  }

  // Verificado: marca en la sesión (cookie httpOnly) que este correo probó ser
  // dueño de esta instancia. La Pieza 3 lo usará para enrutar el chat.
  await setDuenoVerificado(email, r.instancia);
  return Response.json({ ok: true, instancia: r.instancia });
}
