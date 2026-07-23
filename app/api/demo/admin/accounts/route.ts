// Cuentas 1:1 de la demo (dentro del panel admin).
//   GET  → lista las demos 1:1 (privadas + legado). Protegido por contraseña.
//   POST → crea una demo 1:1 privada: {nombre, email, instancia}. Devuelve el
//          link /demo/<token> con el token recién generado (para copiarlo).
//
// Misma auth que el resto del apartado Demo: header X-Admin-Password contra
// DEMO_ADMIN_PASSWORD (ver lib/demo/admin.ts). No inventa auth nueva.

import { isAdminAuthorized } from "@/lib/demo/admin";
import {
  listAccounts,
  crearPrivada,
  crearGeneral,
  INSTANCIAS,
  type Instancia,
} from "@/lib/demo/accountStore";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ accounts: await listAccounts() });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "json_invalido" }, { status: 400 });
  }

  const { tipo, nombre, email, instancia } = (body ?? {}) as {
    tipo?: unknown;
    nombre?: unknown;
    email?: unknown;
    instancia?: unknown;
  };

  // Validación común: nombre y correo siempre obligatorios.
  if (typeof nombre !== "string" || !nombre.trim()) {
    return Response.json({ error: "nombre_requerido" }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return Response.json({ error: "correo_invalido" }, { status: 400 });
  }

  // 'general' es explícito; cualquier otro caso se trata como privada (compat con
  // el cliente anterior, que no mandaba `tipo` y siempre creaba privada).
  const esGeneral = tipo === "general";

  try {
    if (esGeneral) {
      const { yaExistia } = await crearGeneral({ nombre, email });
      return Response.json({ ok: true, tipo: "general", yaExistia });
    }
    // Privada: la instancia es obligatoria y debe ser válida.
    if (typeof instancia !== "string" || !INSTANCIAS.includes(instancia as Instancia)) {
      return Response.json({ error: "instancia_invalida" }, { status: 400 });
    }
    const { token } = await crearPrivada({
      nombre,
      email,
      instancia: instancia as Instancia,
    });
    return Response.json({ ok: true, tipo: "privado", link: `/demo/${token}` });
  } catch (e) {
    // Correo duplicado u otro error de BD → mensaje claro, sin filtrar detalles.
    const msg = e instanceof Error ? e.message : "error";
    const conflicto = /unique|duplicate/i.test(msg);
    return Response.json(
      { error: conflicto ? "correo_ya_existe" : "error_guardando" },
      { status: conflicto ? 409 : 500 },
    );
  }
}
