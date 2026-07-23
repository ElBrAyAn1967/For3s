// PATCH /api/demo/admin/users/[id] — edita una persona desde el panel.
// Protegido por header X-Admin-Password (misma auth del apartado Demo).
//
// Dos operaciones (según el body):
//   { name, email }   → edita datos REALES (se guardan de verdad).
//   { demoUi }        → MOCKUP: cambia solo el demo mostrado (kind_ui). El demo
//                       real (kind) y el hilo del agente NO se mueven. Neon sabe
//                       la verdad (kind ≠ kind_ui). Migrar hilos = pendiente futuro.

import { isAdminAuthorized } from "@/lib/demo/admin";
import { editarUsuario, cambiarDemoMock, eliminarUsuario } from "@/lib/demo/userStore";
import { normalizeEmail, normalizeName, isValidEmail } from "@/lib/demo/normalize";
import type { DemoKind } from "@/lib/demo/types";

const DEMOS: DemoKind[] = ["jazz", "mashe", "brian", "general"];

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id) return Response.json({ error: "id_requerido" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "json_invalido" }, { status: 400 });
  }
  const { name, email, demoUi } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    demoUi?: unknown;
  };

  // Caso MOCKUP: cambiar el demo mostrado.
  if (demoUi !== undefined) {
    if (typeof demoUi !== "string" || !DEMOS.includes(demoUi as DemoKind)) {
      return Response.json({ error: "demo_invalido" }, { status: 400 });
    }
    const r = await cambiarDemoMock(id, demoUi as DemoKind);
    if (r === "no_existe") return Response.json({ error: "no_existe" }, { status: 404 });
    return Response.json({ ok: true, mock: true });
  }

  // Caso REAL: editar nombre y/o correo.
  const cambios: { name?: string; email?: string } = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !normalizeName(name)) {
      return Response.json({ error: "nombre_invalido" }, { status: 400 });
    }
    cambios.name = normalizeName(name);
  }
  if (email !== undefined) {
    const e = normalizeEmail(typeof email === "string" ? email : "");
    if (!isValidEmail(e)) {
      return Response.json({ error: "correo_invalido" }, { status: 400 });
    }
    cambios.email = e;
  }
  if (cambios.name === undefined && cambios.email === undefined) {
    return Response.json({ error: "nada_que_cambiar" }, { status: 400 });
  }

  const r = await editarUsuario(id, cambios);
  if (r === "no_existe") return Response.json({ error: "no_existe" }, { status: 404 });
  if (r === "email_en_uso") return Response.json({ error: "correo_ya_existe" }, { status: 409 });
  return Response.json({ ok: true });
}

// DELETE — elimina la persona (y su puerta 1:1 si la tenía).
export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!id) return Response.json({ error: "id_requerido" }, { status: 400 });

  const r = await eliminarUsuario(id);
  if (r === "no_existe") return Response.json({ error: "no_existe" }, { status: 404 });
  return Response.json({ ok: true });
}
