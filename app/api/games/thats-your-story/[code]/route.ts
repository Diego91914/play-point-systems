import { NextRequest, NextResponse } from "next/server";
import {
  actStoryRoom,
  getStoryRoom,
} from "@/lib/play-point-core/thats-your-story-server";
type Context = { params: Promise<{ code: string }> };
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { code } = await params;
    return NextResponse.json(
      {
        success: true,
        ...(await getStoryRoom(
          code,
          request.headers.get("x-room-player"),
          request.headers.get("authorization")?.replace(/^Bearer /, ""),
        )),
      },
      { headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load game.",
      },
      { status: 400, headers },
    );
  }
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { code } = await params,
      body = await request.json();
    return NextResponse.json(
      {
        success: true,
        ...(await actStoryRoom(
          code,
          body.playerId,
          body.token,
          body.action,
          body.payload,
        )),
      },
      { headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update game.",
      },
      { status: 400, headers },
    );
  }
}
