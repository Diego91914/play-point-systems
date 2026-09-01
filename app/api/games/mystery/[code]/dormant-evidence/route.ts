import { NextResponse } from "next/server";
import { decideMysteryDormantEvidence, getMysteryDormantEvidence } from "@/lib/play-point-core/mystery-dormant-evidence-server";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const url = new URL(request.url);
    return NextResponse.json(await getMysteryDormantEvidence(code, url.searchParams.get("playerId") ?? "", url.searchParams.get("token") ?? ""));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load private evidence." }, { status: 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    return NextResponse.json(await decideMysteryDormantEvidence(code, typeof body.playerId === "string" ? body.playerId : "", typeof body.token === "string" ? body.token : "", body.decision));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update private evidence." }, { status: 400 });
  }
}
