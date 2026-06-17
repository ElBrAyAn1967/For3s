// POST /api/demo/heartbeat — mantiene viva la sesión y reevalúa la cola.
// Body: { kind: DemoKind }. El cliente lo llama periódicamente mientras usa la demo.

import type { NextRequest } from "next/server";
import { getOrCreateSessionId } from "@/lib/demo/session";
import { heartbeat } from "@/lib/demo/store";
import type { CapacityResponse, DemoKind } from "@/lib/demo/types";

const VALID: DemoKind[] = ["jazz", "mashe", "brian", "general"];

export async function POST(request: NextRequest) {
  const { kind } = (await request.json().catch(() => ({}))) as { kind?: string };
  if (!kind || !VALID.includes(kind as DemoKind)) {
    return Response.json({ error: "invalid_kind" }, { status: 400 });
  }

  const cookieId = await getOrCreateSessionId();
  const result = heartbeat(cookieId, kind as DemoKind, Date.now());
  return Response.json(result satisfies CapacityResponse);
}
