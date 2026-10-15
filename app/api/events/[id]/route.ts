import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  AMPLIFIED_EVENT_TABLES,
  getAmplifiedEventAccount,
  loadOwnedAmplifiedEvent,
  normalizeAmplifiedEventDraft,
  replaceAmplifiedEventDraftChildren,
} from "@/lib/play-point-core/play-amplified-event-server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to manage Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  try {
    const event = await loadOwnedAmplifiedEvent(id, claims.sub);
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ event });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not load event." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to manage Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  const draft = normalizeAmplifiedEventDraft(await request.json().catch(() => ({})));
  const supabase = getSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,status")
    .eq("id", id)
    .eq("owner_user_id", claims.sub)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Published events are locked for registration. Refresh the roster, balance teams, and start the event instead of rewriting the draft." }, { status: 409 });
  }

  const { error } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .update({
      template_id: draft.templateId,
      name: draft.name,
      event_date: draft.eventDate,
      team_count: draft.teamCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_user_id", claims.sub);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await replaceAmplifiedEventDraftChildren(id, draft);
    const event = await loadOwnedAmplifiedEvent(id, claims.sub);
    return NextResponse.json({ event });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not update event draft." }, { status: 500 });
  }
}
