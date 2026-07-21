// GET /api/demo/admin/users — lista de personas de la demo General + conteos.
// Protegido por header X-Admin-Password. Devuelve datos sin secretos.

import { isAdminAuthorized } from "@/lib/demo/admin";
import { listUsers, counts } from "@/lib/demo/userStore";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = Date.now();
  return Response.json({
    users: await listUsers(now),
    counts: await counts(now),
  });
}