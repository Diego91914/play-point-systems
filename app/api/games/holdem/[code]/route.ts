import { NextRequest, NextResponse } from "next/server";
import { getTableForPlayer, performTableAction, type HoldemRequestAction } from "@/lib/play-point-core/holdem-server";

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
    const allowed = new Set([
      "start_hand", "fold", "check", "call", "raise", "all_in",
      "sit_out", "return", "host_remove", "host_reset_stack",
    ]);
    if (!allowed.has(body?.type)) return NextResponse.json({ error: "Unknown poker action." }, { status: 400 });

    let action: HoldemRequestAction;
    if (body.type === "raise") {
      action = { type: "raise", raiseTo: Number(body.raiseTo) };
    } else if (body.type === "host_remove") {
      action = { type: "host_remove", playerId: String(body.playerId ?? "") };
    } else if (body.type === "host_reset_stack") {
      action = { type: "host_reset_stack", playerId: String(body.playerId ?? ""), amount: Number(body.amount) };
    } else {
      action = { type: body.type } as HoldemRequestAction;
    }

    const table = await performTableAction(code, playerId, token, action);
    return NextResponse.json({ success: true, table });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to perform poker action.";
    const status = message === "Table not found." ? 404 : message === "Invalid player session." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
