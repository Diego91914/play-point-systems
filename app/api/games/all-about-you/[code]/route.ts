import { NextRequest, NextResponse } from "next/server";
import { actAllAboutYouRoom, getAllAboutYouRoom } from "@/lib/play-point-core/all-about-you-server";

type ProjectedState = Record<string, unknown> & {
  status?: unknown;
  guestPhotoUrl?: unknown;
  guestPhotoPath?: unknown;
  me?: { isHost?: unknown } | null;
};

function protectFinalePhoto<T extends { state: ProjectedState }>(result: T): T {
  const state = { ...result.state };
  const hostPreview = state.status === "lobby" && state.me?.isHost === true;
  const finale = state.status === "finished";
  if (!hostPreview && !finale) {
    delete state.guestPhotoUrl;
    delete state.guestPhotoPath;
  }
  return { ...result, state };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const playerId = request.nextUrl.searchParams.get("playerId") ?? "";
    const token = request.nextUrl.searchParams.get("token") ?? "";
    const result = await getAllAboutYouRoom(code, playerId, token);
    return NextResponse.json({ success: true, ...protectFinalePhoto(result) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load game." }, { status: 400 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await actAllAboutYouRoom(code, body.playerId, body.token, body.action, body.payload);
    return NextResponse.json({ success: true, ...protectFinalePhoto(result) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update game." }, { status: 400 });
  }
}
