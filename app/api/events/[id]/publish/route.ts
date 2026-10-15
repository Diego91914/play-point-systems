import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  AMPLIFIED_EVENT_TABLES,
  generateUniqueAmplifiedEventJoinCode,
  getAmplifiedEventAccount,
  loadOwnedAmplifiedEvent,
} from "@/lib/play-point-core/play-amplified-event-server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const claims = await getAmplifiedEventAccount();
  if (!claims) return NextResponse.json({ error: "Sign in to publish Play Amplified Events." }, { status: 401 });
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,status,join_code")
    .eq("id", id)
    .eq("owner_user_id", claims.sub)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (existing.status === "live" || existing.status === "complete" || existing.status === "archived") {
    return NextResponse.json({ error: "This event is already live or closed." }, { status: 409 });
  }

  const joinCode = existing.join_code || await generateUniqueAmplifiedEventJoinCode();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .update({
      status: "published",
      join_code: joinCode,
      registration_open: true,
      published_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .eq("owner_user_id", claims.sub);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const event = await loadOwnedAmplifiedEvent(id, claims.sub);
    return NextResponse.json({ event });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Event published but could not be reloaded." }, { status: 500 });
  }
}
