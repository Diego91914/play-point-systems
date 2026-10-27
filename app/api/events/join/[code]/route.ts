import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { AMPLIFIED_EVENT_TABLES, amplifiedEventErrorStatus } from "@/lib/play-point-core/play-amplified-event-server";

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

  const { data, error } = await getSupabaseServerClient().rpc("ppl_amplified_event_mutate", {
    p_action: "join", p_event_id: null, p_owner_user_id: null, p_payload: { code, name },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: amplifiedEventErrorStatus(error) });
  return NextResponse.json(data, { status: data.matched ? 200 : 201 });
}
