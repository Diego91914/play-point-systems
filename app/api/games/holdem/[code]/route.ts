import { NextRequest, NextResponse } from "next/server";
import { getTableForPlayer, performTableAction } from "@/lib/play-point-core/holdem-server";
import type { HoldemAction } from "@/lib/play-point-core/holdem";

function credentials(request: NextRequest) {
  return {
    playerId: request.headers.get("x-holdem-player-id") ?? "",
    token: request.headers.get("x-holdem-token") ?? "",
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { playerId, token } = credentials(request);
    if (!playerId || !token) return NextResponse.json({ error: "Missing player session." }, { status: 401 });
    const table = await getTableForPlayer(code, playerId, token);
    return NextResponse.json({ success: true, table });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load poker table.";
    const status = message === "Table not found." ? 404 : message === "Invalid player session." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { playerId, token } = credentials(request);
    if (!playerId || !token) return NextResponse.json({ error: "Missing player session." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const allowed = new Set(["start_hand", "fold", "check", "call", "raise", "all_in"]);
    if (!allowed.has(body?.type)) return NextResponse.json({ error: "Unknown poker action." }, { status: 400 });
    const action = (body?.type === "raise" ? { type: "raise", raiseTo: Number(body.raiseTo) } : { type: body.type }) as HoldemAction;
    const table = await performTableAction(code, playerId, token, action);
    return NextResponse.json({ success: true, table });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to perform poker action.";
    const status = message === "Table not found." ? 404 : message === "Invalid player session." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
