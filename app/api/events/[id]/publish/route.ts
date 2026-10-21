import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  getAmplifiedEventAccount, loadOwnedAmplifiedEvent, amplifiedEventErrorStatus,
  generateUniqueAmplifiedEventJoinCode,
} from "@/lib/play-point-core/play-amplified-event-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to publish Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  try {
    const { error } = await getSupabaseServerClient().rpc("ppl_amplified_event_mutate", {
      p_action: "publish", p_event_id: id, p_owner_user_id: claims.sub,
      p_payload: { joinCode: await generateUniqueAmplifiedEventJoinCode() },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: amplifiedEventErrorStatus(error) });
    return NextResponse.json({ event: await loadOwnedAmplifiedEvent(id, claims.sub) });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not publish event." }, { status: 500 });
  }
}
