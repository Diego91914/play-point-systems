import { NextResponse } from "next/server";
import { getPublicTable } from "@/lib/play-point-core/holdem-server";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const table = await getPublicTable(code);
    return NextResponse.json({ success: true, table });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load poker table.";
    const status = message === "Table not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
