import { NextResponse } from "next/server";
import { loadPublicAmplifiedEventHubByCode } from "@/lib/play-point-core/play-amplified-event-hub-server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  try {
    const hub = await loadPublicAmplifiedEventHubByCode(code);
    if (!hub) return NextResponse.json({ error: "Event Hub not found." }, { status: 404 });
    return NextResponse.json({ hub }, { headers: { "cache-control": "no-store" } });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Could not load Event Hub." },
      { status: 500 },
    );
  }
}
