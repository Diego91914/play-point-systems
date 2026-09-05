import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

type Player = { id: string; name: string; tokenHash: string; seat: number; roleId?: string };
type MysteryState = { status: string; players: Player[] };

const ROLE_TITLES: Record<string, string> = {
  partner: "The Business Partner",
  sister: "The Younger Sister",
  chef: "The Private Chef",
  murderer: "The Old Friend",
  lawyer: "The Family Lawyer",
  assistant: "The Personal Assistant",
  cousin: "The Cousin",
  neighbor: "The Neighbor",
};

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function tokenMatches(expected: string, token: string) {
  const a = Buffer.from(hash(token), "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId") ?? "";
    const token = url.searchParams.get("token") ?? "";
    if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error("Invalid room code.");

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("ppl_mystery_rooms").select("state").eq("code", code).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Mystery room not found.");

    const state = data.state as MysteryState;
    const viewer = state.players.find(player => player.id === playerId);
    if (!viewer || !tokenMatches(viewer.tokenHash, token)) throw new Error("Invalid player session.");

    return NextResponse.json({
      status: state.status,
      cast: state.players.map(player => ({
        id: player.id,
        name: player.name,
        seat: player.seat,
        roleId: player.roleId ?? null,
        roleTitle: player.roleId ? ROLE_TITLES[player.roleId] ?? "Guest" : null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load cast." }, { status: 400 });
  }
}
