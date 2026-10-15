import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { AMPLIFIED_EVENT_TABLES } from "@/lib/play-point-core/play-amplified-event-server";

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await context.params;
  const code = normalizeCode(rawCode);
  if (code.length < 6) return NextResponse.json({ error: "Invalid event code." }, { status: 400 });
  const supabase = getSupabaseServerClient();
  const { data: event, error } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,template_id,name,event_date,status,join_code,registration_open")
    .eq("join_code", code)
    .in("status", ["published", "live"])
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const { data: activities, error: activityError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.activities)
    .select("module_id,name,sort_order,status")
    .eq("event_id", event.id)
    .order("sort_order");
  if (activityError) return NextResponse.json({ error: activityError.message }, { status: 500 });
  return NextResponse.json({ event: { ...event, activities: activities ?? [] } });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await context.params;
  const code = normalizeCode(rawCode);
  const body = await request.json().catch(() => ({})) as { name?: string };
  const name = String(body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  if (code.length < 6) return NextResponse.json({ error: "Invalid event code." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Enter your name to join the event." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data: event, error } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,name,status,registration_open")
    .eq("join_code", code)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.status !== "published" || !event.registration_open) {
    return NextResponse.json({ error: "Registration is closed for this event." }, { status: 409 });
  }

  const { data: matches, error: matchError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.participants)
    .select("id,display_name,skill,source,checked_in")
    .eq("event_id", event.id)
    .ilike("display_name", name)
    .limit(2);
  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });

  if ((matches ?? []).length === 1) {
    const existing = matches![0];
    const { data: player, error: updateError } = await supabase
      .from(AMPLIFIED_EVENT_TABLES.participants)
      .update({ checked_in: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id,display_name,skill,source,checked_in")
      .single();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ player, matched: true });
  }

  const { data: player, error: insertError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.participants)
    .insert({ event_id: event.id, display_name: name, skill: 3, source: "qr", checked_in: true })
    .select("id,display_name,skill,source,checked_in")
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ player, matched: false }, { status: 201 });
}
