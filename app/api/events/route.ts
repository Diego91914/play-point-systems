import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  AMPLIFIED_EVENT_TABLES,
  getAmplifiedEventAccount,
  loadOwnedAmplifiedEvent,
  normalizeAmplifiedEventDraft,
  amplifiedEventDraftPayload,
  amplifiedEventErrorStatus,
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
  if (!claims) return NextResponse.json({ error: "Sign in to manage Play Amplified Events." }, { status: 401 });
  const draft = normalizeAmplifiedEventDraft(await request.json().catch(() => ({})));
  try {
    const { data, error } = await getSupabaseServerClient().rpc("ppl_amplified_event_mutate", {
      p_action: "create", p_event_id: null, p_owner_user_id: claims.sub,
      p_payload: amplifiedEventDraftPayload(draft),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: amplifiedEventErrorStatus(error) });
    const event = await loadOwnedAmplifiedEvent(data.id, claims.sub);
    return NextResponse.json({ event }, { status: 201 });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not save event draft." }, { status: 500 });
  }
}
