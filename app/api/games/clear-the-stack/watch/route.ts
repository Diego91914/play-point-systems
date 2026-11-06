import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { normalizeStackState } from "@/lib/play-point-core/clear-stack-engine";

const headers = { "Cache-Control": "private, no-store" };

// A spectator link is a 256-bit, read-only capability, NOT a scoring credential.
// Room ids, account identifiers and host session tokens are never returned.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[0-9a-f]{64}$/.test(token))
    return NextResponse.json({ error: "Invalid spectator link." }, { status: 404, headers });
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ppl_clear_stack_rooms")
    .select("distance,stack_size,status,game_state")
    .eq("spectator_token", token).maybeSingle();
  if (error || !data)
    return NextResponse.json({ error: "Spectator session not found." }, { status: 404, headers });
  // QR links stay usable across rounds and roster changes, even overnight.
  // Only the host's explicit end-session action revokes them.
  if (data.status === "closed")
    return NextResponse.json({ error: "The host ended this live session.", ended: true }, { status: 410, headers });

  const state = normalizeStackState(data.game_state, data.distance, data.stack_size);
  return NextResponse.json({
    game: {
      phase: state.phase,
      distance: state.distance,
      stackSize: state.stackSize,
      players: state.players.map(player => ({
        name: player.name, score: player.score, setScore: player.setScore, setScores: player.setScores,
        remaining: player.remaining, rounds: player.rounds,
      })),
      round: state.round, turn: state.turn, match: state.match,
      currentSet: state.currentSet, setResults: state.setResults, setsWon: state.setsWon,
      matchWinnerIndex: state.matchWinnerIndex, matchTied: state.matchTied,
    },
  }, { headers });
}
