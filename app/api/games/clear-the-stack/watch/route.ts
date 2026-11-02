import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { initialStackState, type StackState } from "@/lib/play-point-core/clear-stack-engine";

const headers = { "Cache-Control": "private, no-store" };

// A spectator link is a 256-bit, read-only capability, NOT a scoring credential.
// Room ids, account identifiers and host session tokens are never returned.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[0-9a-f]{64}$/.test(token))
    return NextResponse.json({ error: "Invalid spectator link." }, { status: 404, headers });
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_clear_stack_rooms")
    .select("distance,stack_size,status,game_state,created_at")
    .eq("spectator_token", token).maybeSingle();
  if (error || !data || data.status === "closed"
    || Date.now() - new Date(data.created_at).getTime() > 24 * 60 * 60 * 1000)
    return NextResponse.json({ error: "This spectator link has ended or expired." }, { status: 404, headers });

  const state = data.game_state && typeof data.game_state === "object" && "phase" in data.game_state
    ? data.game_state as StackState
    : initialStackState(data.distance, data.stack_size);
  return NextResponse.json({
    game: {
      phase: state.phase,
      distance: state.distance,
      stackSize: state.stackSize,
      players: state.players.map(player => ({
        name: player.name, score: player.score,
        remaining: player.remaining, rounds: player.rounds,
      })),
      round: state.round, turn: state.turn,
    },
  }, { headers });
}
