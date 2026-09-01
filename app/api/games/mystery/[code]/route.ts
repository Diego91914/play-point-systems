import { NextRequest, NextResponse } from "next/server";
import { actMysteryRoom, getMysteryRoom } from "@/lib/play-point-core/mystery-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const playerId = request.nextUrl.searchParams.get("playerId") ?? "";
    const token = request.nextUrl.searchParams.get("token") ?? "";
    return NextResponse.json({ success: true, ...(await getMysteryRoom(code, playerId, token)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load mystery." }, { status: 400 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ success: true, ...(await actMysteryRoom(code, body.playerId, body.token, body.action, body.payload)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update mystery." }, { status: 400 });
  }
}
