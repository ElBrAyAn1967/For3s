// POST /api/demo/leave — libera el cupo y promueve al primero de la cola.
// Body: { kind: DemoKind }.

import type { NextRequest } from "next/server";
import { readSessionId } from "@/lib/demo/session";
import { leave } from "@/lib/demo/store";
import type { DemoKind } from "@/lib/demo/types";

const VALID: DemoKind[] = ["jazz", "mashe", "brian", "general"];

export async function POST(request: NextRequest) {
  const { kind } = (await request.json().catch(() => ({}))) as { kind?: string };
  if (!kind || !VALID.includes(kind as DemoKind)) {
    return Response.json({ error: "invalid_kind" }, { status: 400 });
  }

  const cookieId = await readSessionId();
  if (cookieId) leave(cookieId, kind as DemoKind, Date.now());
  return Response.json({ ok: true });
}
