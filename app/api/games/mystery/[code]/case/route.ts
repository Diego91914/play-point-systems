import { NextResponse } from "next/server";
import { getMysteryCase, submitMysteryCase } from "@/lib/play-point-core/mystery-case-server-v2";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId") ?? "";
    const token = url.searchParams.get("token") ?? "";
    return NextResponse.json(await getMysteryCase(code, playerId, token));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load case." }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    const token = typeof body.token === "string" ? body.token : "";
    const payload = body && typeof body.payload === "object" && body.payload ? body.payload : {};
    return NextResponse.json(await submitMysteryCase(code, playerId, token, payload));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit case." }, { status: 400 });
  }
}
