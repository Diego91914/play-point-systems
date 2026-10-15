import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  AMPLIFIED_EVENT_TABLES,
  getAmplifiedEventAccount,
} from "@/lib/play-point-core/play-amplified-event-server";
import {
  AMPLIFIED_EVENT_RESULTS_TABLE,
  loadOwnedAmplifiedEventHub,
} from "@/lib/play-point-core/play-amplified-event-hub-server";
import {
  normalizeAmplifiedResultEntries,
  normalizeResultSource,
} from "@/lib/play-point-core/play-amplified-event-scoring";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to manage event results." }, { status: 401 });
  const { id } = await context.params;
  try {
    const event = await loadOwnedAmplifiedEventHub(id, claims.sub);
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ event }, { headers: { "cache-control": "no-store" } });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not load event results." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to score Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({})) as {
    activityId?: string;
    source?: unknown;
    entries?: unknown;
  };
  const activityId = String(body.activityId ?? "").trim();
  const source = normalizeResultSource(body.source);
  const entries = normalizeAmplifiedResultEntries(body.entries);
  if (!activityId || !entries.length) {
    return NextResponse.json({ error: "Choose an activity and enter at least one ranked result." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: event, error: eventError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,status")
    .eq("id", id)
    .eq("owner_user_id", claims.sub)
    .maybeSingle();
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.status !== "live") {
    return NextResponse.json({ error: "Event results can only be entered after teams are locked and the event is live." }, { status: 409 });
  }

  const { data: activity, error: activityError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.activities)
    .select("id,module_id,name,status")
    .eq("id", activityId)
    .eq("event_id", id)
    .maybeSingle();
  if (activityError) return NextResponse.json({ error: activityError.message }, { status: 500 });
  if (!activity) return NextResponse.json({ error: "Activity not found for this event." }, { status: 404 });

  const [{ data: teams, error: teamError }, { data: participants, error: participantError }] = await Promise.all([
    supabase.from(AMPLIFIED_EVENT_TABLES.teams).select("id").eq("event_id", id),
    supabase.from(AMPLIFIED_EVENT_TABLES.participants).select("id").eq("event_id", id),
  ]);
  if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 });
  if (participantError) return NextResponse.json({ error: participantError.message }, { status: 500 });
  const teamIds = new Set((teams ?? []).map((team) => team.id));
  const participantIds = new Set((participants ?? []).map((participant) => participant.id));
  if (entries.some((entry) => entry.entityType === "team" ? !teamIds.has(entry.entityId) : !participantIds.has(entry.entityId))) {
    return NextResponse.json({ error: "One or more ranked entries do not belong to this event." }, { status: 400 });
  }

  const { data: existing, error: versionError } = await supabase
    .from(AMPLIFIED_EVENT_RESULTS_TABLE)
    .select("result_version")
    .eq("activity_id", activityId)
    .order("result_version", { ascending: false })
    .limit(1);
  if (versionError) return NextResponse.json({ error: versionError.message }, { status: 500 });
  const version = ((existing?.[0]?.result_version as number | undefined) ?? 0) + 1;

  const { error: insertError } = await supabase.from(AMPLIFIED_EVENT_RESULTS_TABLE).insert(entries.map((entry) => ({
    event_id: id,
    activity_id: activityId,
    result_version: version,
    entity_type: entry.entityType,
    team_id: entry.entityType === "team" ? entry.entityId : null,
    participant_id: entry.entityType === "participant" ? entry.entityId : null,
    placement: entry.placement,
    raw_score: entry.rawScore,
    score_label: entry.scoreLabel,
    event_points: entry.eventPoints,
    source,
    source_ref: entry.sourceRef,
    metadata: entry.metadata,
  })));
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const { error: activityUpdateError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.activities)
    .update({ status: "complete", updated_at: new Date().toISOString() })
    .eq("id", activityId)
    .eq("event_id", id);
  if (activityUpdateError) return NextResponse.json({ error: activityUpdateError.message }, { status: 500 });

  try {
    const fullEvent = await loadOwnedAmplifiedEventHub(id, claims.sub);
    return NextResponse.json({ event: fullEvent, resultVersion: version });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Results saved but the Event Hub could not be reloaded." }, { status: 500 });
  }
}
