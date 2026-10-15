import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  AMPLIFIED_EVENT_TABLES,
  getAmplifiedEventAccount,
  loadOwnedAmplifiedEvent,
  normalizeAmplifiedEventDraft,
  replaceAmplifiedEventDraftChildren,
} from "@/lib/play-point-core/play-amplified-event-server";

export async function GET() {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to manage Play Amplified Events." }, { status: 401 });
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,template_id,name,event_date,status,join_code,team_count,registration_open,published_at,started_at,created_at,updated_at")
    .eq("owner_user_id", claims.sub)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: Request) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to create a Play Amplified Event." }, { status: 401 });
  const draft = normalizeAmplifiedEventDraft(await request.json().catch(() => ({})));
  const supabase = getSupabaseServerClient();
  const { data: event, error } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .insert({
      owner_user_id: claims.sub,
      template_id: draft.templateId,
      name: draft.name,
      event_date: draft.eventDate,
      team_count: draft.teamCount,
      status: "draft",
      registration_open: false,
    })
    .select("id")
    .single();
  if (error || !event) return NextResponse.json({ error: error?.message ?? "Could not create event." }, { status: 500 });

  try {
    await replaceAmplifiedEventDraftChildren(event.id, draft);
    const fullEvent = await loadOwnedAmplifiedEvent(event.id, claims.sub);
    return NextResponse.json({ event: fullEvent }, { status: 201 });
  } catch (caught) {
    await supabase.from(AMPLIFIED_EVENT_TABLES.events).delete().eq("id", event.id).eq("owner_user_id", claims.sub);
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not save event draft." }, { status: 500 });
  }
}
