import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  getAmplifiedEventAccount,
  loadOwnedAmplifiedEvent,
  normalizeAmplifiedEventDraft,
  amplifiedEventDraftPayload,
  amplifiedEventErrorStatus,
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to manage Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  const draft = normalizeAmplifiedEventDraft(await request.json().catch(() => ({})));
  try {
    const { data, error } = await getSupabaseServerClient().rpc("ppl_amplified_event_mutate", {
      p_action: "save", p_event_id: id, p_owner_user_id: claims.sub,
      p_payload: amplifiedEventDraftPayload(draft),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: amplifiedEventErrorStatus(error) });
    const event = await loadOwnedAmplifiedEvent(data.id, claims.sub);
    return NextResponse.json({ event }, { status: 200 });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not save event draft." }, { status: 500 });
  }
}
