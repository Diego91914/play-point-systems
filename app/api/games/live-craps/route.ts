import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createLiveCrapsServerRoom, joinLiveCrapsServerRoom } from "@/lib/play-point-core/live-craps-room-server";
import type { LiveCrapsDiceMode } from "@/lib/play-point-core/live-craps-dice-mode";

/** Initial table entry always receives a fresh opaque server-owned identity. Rejoin uses the issued playerId + token on the room endpoint. */
function newPlayerId() {
  return `player-${randomUUID()}`;
}

function diceMode(value: unknown): LiveCrapsDiceMode | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value !== "physical" && value !== "virtual") throw new Error("diceMode must be physical or virtual.");
  return value;
}

function requiredName(value: unknown, fallback: string) {
  const name = typeof value === "string" ? value.trim() : "";
  return name || fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "";
    if (action === "create") {
      const result = createLiveCrapsServerRoom({
        code: String(body.code ?? ""),
        hostPlayerId: newPlayerId(),
        hostName: requiredName(body.name, "Host"),
        diceMode: diceMode(body.diceMode),
      });
      return NextResponse.json({ success: true, ...result }, { status: 201 });
    }
    if (action === "join") {
      const result = joinLiveCrapsServerRoom(String(body.code ?? ""), {
        playerId: newPlayerId(),
        name: requiredName(body.name, "Player"),
      });
      return NextResponse.json({ success: true, ...result });
    }
    throw new Error("Live Craps action must be create or join.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to enter Live Craps." }, { status: 400 });
  }
}
