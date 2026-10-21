import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { amplifiedEventErrorStatus, getAmplifiedEventAccount } from "@/lib/play-point-core/play-amplified-event-server";
import { loadOwnedAmplifiedEventHub } from "@/lib/play-point-core/play-amplified-event-hub-server";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to complete Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  try {
    const { error } = await getSupabaseServerClient().rpc("ppl_amplified_event_score", {
      p_action: "complete", p_event_id: id, p_owner_user_id: claims.sub, p_payload: {},
    });
    if (error) return NextResponse.json({ error: error.message }, { status: amplifiedEventErrorStatus(error) });
    return NextResponse.json({ event: await loadOwnedAmplifiedEventHub(id, claims.sub) });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not complete event." }, { status: 500 });
  }
}
