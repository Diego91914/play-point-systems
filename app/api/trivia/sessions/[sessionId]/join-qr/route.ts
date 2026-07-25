import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getTriviaLiveJoinUrl } from "../../../../../games/trivia/play/trivia-live-session";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  try {
    const joinUrl = getTriviaLiveJoinUrl(sessionId, new URL(request.url).origin);
    const svg = await QRCode.toString(joinUrl, {
      type: "svg",
      margin: 1,
      width: 256,
      color: {
        dark: "#050912",
        light: "#FFFFFFFF",
      },
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate the join QR code.",
      },
      { status: 404 },
    );
  }
}
