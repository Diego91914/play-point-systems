import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  getAmplifiedEventAccount, loadOwnedAmplifiedEvent, amplifiedEventErrorStatus,
} from "@/lib/play-point-core/play-amplified-event-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to start Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  const raw = await request.json().catch(() => ({})) as { teams?: Array<{ name?: string; participantIds?: string[] }> };
  const teams = (Array.isArray(raw.teams) ? raw.teams : []).slice(0, 32).map((team, index) => ({
    name: String(team.name ?? `Team ${index + 1}`).trim().slice(0, 60) || `Team ${index + 1}`,
    participantIds: Array.isArray(team.participantIds) ? team.participantIds.map(String) : [],
  }));
  if (!teams.length) return NextResponse.json({ error: "Balance at least one team before starting the event." }, { status: 400 });
  try {
    const { error } = await getSupabaseServerClient().rpc("ppl_amplified_event_mutate", {
      p_action: "start", p_event_id: id, p_owner_user_id: claims.sub,
      p_payload: { teams },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: amplifiedEventErrorStatus(error) });
    return NextResponse.json({ event: await loadOwnedAmplifiedEvent(id, claims.sub) });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not start event." }, { status: 500 });
  }
}
