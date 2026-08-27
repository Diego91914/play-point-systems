import { NextRequest, NextResponse } from "next/server";
import { createTable, joinTable } from "@/lib/play-point-core/holdem-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.intent === "create") {
      return NextResponse.json({ success: true, ...(await createTable(body)) });
    }
    if (body?.intent === "join") {
      return NextResponse.json({ success: true, ...(await joinTable(body.code, body.name)) });
    }
    return NextResponse.json({ error: "Unknown poker request." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open poker table.";
    const status = message === "Table not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
