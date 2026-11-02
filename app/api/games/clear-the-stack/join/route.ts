import { NextResponse } from "next/server";

// Retired: Clear the Stack uses host-entered player names only.
// Scanning a QR opens a read-only spectator view, not a registration form.
export async function GET() {
  return NextResponse.json({ error: "Player registration has been replaced by spectator-only QR viewing." }, { status: 410 });
}
export async function POST() {
  return NextResponse.json({ error: "Only the host enters player names and scores." }, { status: 410 });
}
