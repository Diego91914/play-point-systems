import { NextRequest, NextResponse } from "next/server";
import { actLiveCrapsRoom, getLiveCrapsRoom } from "@/lib/play-point-core/live-craps-room-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const playerId = request.nextUrl.searchParams.get("playerId") ?? "";
    const token = request.nextUrl.searchParams.get("token") ?? "";
    const result = await getLiveCrapsRoom(code, playerId, token);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load Live Craps." }, { status: 400 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    if (!body.commandId || typeof body.commandId !== "string") throw new Error("commandId is required for Live Craps actions.");
    const result = await actLiveCrapsRoom(code, body.playerId, body.token, body.commandId, body.action, body.payload);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update Live Craps." }, { status: 400 });
  }
}
