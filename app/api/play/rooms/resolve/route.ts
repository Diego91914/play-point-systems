import { NextRequest, NextResponse } from "next/server";
import { resolvePlayAmplifiedRoom } from "@/lib/play-point-core/room-registry";

import { registerShotCaddySession } from "@/lib/play-point-core/shot-caddy-directory";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code") ?? "";
    const room = await resolvePlayAmplifiedRoom(code) ?? await registerShotCaddySession(code);
    if (!room) return NextResponse.json({ error: "Room not found. Check the code with the host." }, { status: 404 });
    return NextResponse.json({ success: true, room });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to find room." }, { status: 500 });
  }
}
