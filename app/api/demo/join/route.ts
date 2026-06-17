// POST /api/demo/join  — intenta ocupar un cupo en la demo indicada.
// Body: { kind: DemoKind }. Responde el estado resultante (active | waiting).
//
// FASE 1: usa el store in-memory. No conecta al server for3s ni a Postgres.

import type { NextRequest } from "next/server";
import { getOrCreateSessionId } from "@/lib/demo/session";
import { join } from "@/lib/demo/store";
import type { CapacityResponse, DemoKind } from "@/lib/demo/types";

const VALID: DemoKind[] = ["jazz", "mashe", "brian", "general"];

export async function POST(request: NextRequest) {
  const { kind } = (await request.json().catch(() => ({}))) as { kind?: string };
  if (!kind || !VALID.includes(kind as DemoKind)) {
    return Response.json({ error: "invalid_kind" }, { status: 400 });
  }

  const cookieId = await getOrCreateSessionId();
  const result = join(cookieId, kind as DemoKind, Date.now());
  return Response.json(result satisfies CapacityResponse);
}
