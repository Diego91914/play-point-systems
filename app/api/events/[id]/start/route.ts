import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  AMPLIFIED_EVENT_TABLES,
  getAmplifiedEventAccount,
  loadOwnedAmplifiedEvent,
} from "@/lib/play-point-core/play-amplified-event-server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to start Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  const raw = await request.json().catch(() => ({})) as { teams?: Array<{ name?: string; totalSkill?: number; participantIds?: string[] }> };
  const teams = (Array.isArray(raw.teams) ? raw.teams : []).slice(0, 32).map((team, index) => ({
    name: String(team.name ?? `Team ${index + 1}`).trim().slice(0, 60) || `Team ${index + 1}`,
    totalSkill: Math.max(0, Math.floor(Number(team.totalSkill) || 0)),
    participantIds: Array.isArray(team.participantIds) ? team.participantIds.map(String) : [],
  }));
  if (!teams.length) return NextResponse.json({ error: "Balance at least one team before starting the event." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data: event, error: eventError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,status")
    .eq("id", id)
    .eq("owner_user_id", claims.sub)
    .maybeSingle();
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.status !== "published") return NextResponse.json({ error: "Publish the event and finish registration before starting." }, { status: 409 });

  const { data: participants, error: participantError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.participants)
    .select("id")
    .eq("event_id", id);
  if (participantError) return NextResponse.json({ error: participantError.message }, { status: 500 });
  const validIds = new Set((participants ?? []).map((participant) => participant.id));
  const submittedIds = teams.flatMap((team) => team.participantIds);
  if (submittedIds.length !== validIds.size || new Set(submittedIds).size !== submittedIds.length || submittedIds.some((participantId) => !validIds.has(participantId))) {
    return NextResponse.json({ error: "Every registered participant must appear on exactly one team before the event can start." }, { status: 400 });
  }

  const { data: oldTeams } = await supabase.from(AMPLIFIED_EVENT_TABLES.teams).select("id").eq("event_id", id);
  if (oldTeams?.length) {
    const { error: deleteError } = await supabase.from(AMPLIFIED_EVENT_TABLES.teams).delete().eq("event_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { data: insertedTeams, error: teamError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.teams)
    .insert(teams.map((team, index) => ({ event_id: id, name: team.name, sort_order: index + 1, total_skill: team.totalSkill })))
    .select("id,sort_order");
  if (teamError || !insertedTeams) return NextResponse.json({ error: teamError?.message ?? "Could not save teams." }, { status: 500 });

  const members = insertedTeams.flatMap((storedTeam) => {
    const sourceTeam = teams[storedTeam.sort_order - 1];
    return sourceTeam.participantIds.map((participantId) => ({ team_id: storedTeam.id, participant_id: participantId }));
  });
  const { error: memberError } = members.length
    ? await supabase.from(AMPLIFIED_EVENT_TABLES.teamMembers).insert(members)
    : { error: null };
  if (memberError) {
    await supabase.from(AMPLIFIED_EVENT_TABLES.teams).delete().eq("event_id", id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: startError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .update({ status: "live", registration_open: false, started_at: now, updated_at: now })
    .eq("id", id)
    .eq("owner_user_id", claims.sub);
  if (startError) {
    await supabase.from(AMPLIFIED_EVENT_TABLES.teams).delete().eq("event_id", id);
    return NextResponse.json({ error: startError.message }, { status: 500 });
  }

  try {
    const fullEvent = await loadOwnedAmplifiedEvent(id, claims.sub);
    return NextResponse.json({ event: fullEvent });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Event started but could not be reloaded." }, { status: 500 });
  }
}
