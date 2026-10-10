import { NextResponse } from "next/server";
import { registerShotCaddySession } from "@/lib/play-point-core/shot-caddy-directory";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.code !== "string") return NextResponse.json({ error: "Missing session code." }, { status: 400 });
  try {
    const room = await registerShotCaddySession(body.code);
    return room ? NextResponse.json({ success: true, room }) : NextResponse.json({ error: "Session not found or expired." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Session directory unavailable." }, { status: 503 }); }
}
