import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  amplifiedEventErrorStatus,
  getAmplifiedEventAccount,
} from "@/lib/play-point-core/play-amplified-event-server";
import {
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

  try {
    const { data, error } = await getSupabaseServerClient().rpc("ppl_amplified_event_score", {
      p_action: "score", p_event_id: id, p_owner_user_id: claims.sub,
      p_payload: { activityId, source, entries },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: amplifiedEventErrorStatus(error) });
    const event = await loadOwnedAmplifiedEventHub(id, claims.sub);
    return NextResponse.json({ event, resultVersion: data.resultVersion });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Could not save event results." }, { status: 500 });
  }
}
