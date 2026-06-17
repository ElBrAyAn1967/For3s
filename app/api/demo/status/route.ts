// GET /api/demo/status?kind=general — estado actual de mi sesión (sin mutar).
// Útil para que la sala de espera consulte su posición en la cola.

import type { NextRequest } from "next/server";
import { readSessionId } from "@/lib/demo/session";
import { status } from "@/lib/demo/store";
import type { CapacityResponse, DemoKind } from "@/lib/demo/types";

const VALID: DemoKind[] = ["jazz", "mashe", "brian", "general"];

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind");
  if (!kind || !VALID.includes(kind as DemoKind)) {
    return Response.json({ error: "invalid_kind" }, { status: 400 });
  }

  const cookieId = await readSessionId();
  if (!cookieId) {
    return Response.json({
      status: "released",
      position: null,
      activeCount: 0,
      maxConcurrent: 0,
    } satisfies CapacityResponse);
  }

  const result = status(cookieId, kind as DemoKind, Date.now());
  return Response.json(result satisfies CapacityResponse);
}
