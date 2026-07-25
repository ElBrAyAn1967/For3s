// POST /api/demo/verify/check — valida el código que metió el dueño.
// Ronda F0 Pieza 2. Si acierta: marca el correo como verificado en la sesión
// (cookie httpOnly) y devuelve la instancia → la Pieza 3 enrutará su chat ahí.

import { validarCodigo } from "@/lib/demo/verificacion";
import { setDuenoVerificado, setDemoEmail } from "@/lib/demo/session";
import { normalizeEmail, isValidEmail } from "@/lib/demo/normalize";
import { registrarEvento } from "@/lib/demo/eventos";
import { promoverDuenoAsuInstancia, nombreDe } from "@/lib/demo/userStore";

const ERRORES: Record<string, string> = {
  no_hay_codigo: "No hay código pendiente. Pide uno nuevo.",
  expirado: "El código expiró. Pide uno nuevo.",
  bloqueado: "Demasiados intentos. Pide un código nuevo.",
  incorrecto: "Código incorrecto.",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    codigo?: string;
    name?: string;
  };
  const email = normalizeEmail(body.email ?? "");
  const codigo = (body.codigo ?? "").trim();
  const nombreCliente = (body.name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
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
  // Regla "un dueño = su oficina": su PERSONA se crea/actualiza DIRECTAMENTE en SU
  // instancia (rol=dueno, hilo=general). El dueño ya no pasa por general, así que el
  // nombre viene del cliente; si no, se reusa el de un registro previo.
  const nombre = nombreCliente || (await nombreDe(email)) || email.split("@")[0];
  await promoverDuenoAsuInstancia(r.instancia, email, nombre, Date.now());
  // La cookie de sesión debe apuntar a SU instancia (no a 'general'): el shell lee
  // el estado (key, agente, cupo) de la instancia de la cookie.
  await setDemoEmail(email, r.instancia);
  // C5 · Telemetría: el dueño verificó su código correctamente.
  void registrarEvento({ tipo: "verify", instancia: r.instancia, email });
  return Response.json({ ok: true, instancia: r.instancia });
}
