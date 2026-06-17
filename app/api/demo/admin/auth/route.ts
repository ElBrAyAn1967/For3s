// POST /api/demo/admin/auth — valida la contraseña de admin del dashboard.
// Body: { password }. Responde { authenticated } (el cliente guarda el password
// en memoria y lo manda como header X-Admin-Password en las consultas).

import type { NextRequest } from "next/server";
import { checkAdminPassword } from "@/lib/demo/admin";

export async function POST(request: NextRequest) {
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };
  if (!password || !checkAdminPassword(password)) {
    return Response.json({ error: "wrong_password" }, { status: 401 });
  }
  return Response.json({ authenticated: true });
}