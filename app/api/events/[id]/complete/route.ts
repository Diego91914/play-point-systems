import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { AMPLIFIED_EVENT_TABLES, getAmplifiedEventAccount } from "@/lib/play-point-core/play-amplified-event-server";
import { loadOwnedAmplifiedEventHub } from "@/lib/play-point-core/play-amplified-event-hub-server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to complete Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();

  const { data: event, error: eventError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,status")
    .eq("id", id)
    .eq("owner_user_id", claims.sub)
    .maybeSingle();
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.status !== "live") return NextResponse.json({ error: "Only a live event can be completed." }, { status: 409 });

  const { data: activities, error: activityError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.activities)
    .select("id,status")
    .eq("event_id", id);
  if (activityError) return NextResponse.json({ error: activityError.message }, { status: 500 });
  if (!(activities ?? []).length || (activities ?? []).some((activity) => activity.status !== "complete")) {
    return NextResponse.json({ error: "Finish scoring every activity before completing the event." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error: completeError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .update({ status: "complete", registration_open: false, completed_at: now, updated_at: now })
    .eq("id", id)
    .eq("owner_user_id", claims.sub);
  if (completeError) return NextResponse.json({ error: completeError.message }, { status: 500 });

  try {
    const fullEvent = await loadOwnedAmplifiedEventHub(id, claims.sub);
    return NextResponse.json({ event: fullEvent });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Event completed but could not be reloaded." }, { status: 500 });
  }
}
