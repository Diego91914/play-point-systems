import { NextRequest, NextResponse } from "next/server";
import { normalizeRecoveryCode } from "@/lib/play-point-core/quick-score-server";
import { resolveQuickScorePlayerCredentials } from "@/lib/play-point-core/quick-score-auth";
import {
  isQuickScoreEventStatus,
  isQuickScoreEventType,
  mapQuickScoreEventRow,
  normalizeQuickScoreEventName,
} from "@/lib/play-point-core/quick-score-club";
import { requireQuickScoreClubOwner } from "@/lib/play-point-core/quick-score-server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const credentials = resolveQuickScorePlayerCredentials(request);
    if (!credentials) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    await requireQuickScoreClubOwner(
      supabase,
      clubId,
      credentials.playerId,
      credentials.recoveryCode
    );

    const { data, error } = await supabase
      .from("ppl_quick_score_events")
      .select("id, club_id, name, event_type, status, scheduled_for, settings, created_at, updated_at")
      .eq("club_id", clubId)
      .order("scheduled_for", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Failed to load events: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      events: (data ?? []).map((row) => mapQuickScoreEventRow(row)),
    });
  } catch (error) {
    console.error("GET /api/live/quick-score/clubs/[clubId]/events failed:", error);
    const message = error instanceof Error ? error.message : "Unable to load Quick Score events.";
    const status = message === "Invalid player identity" ? 403 : message === "Club not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const body = await request.json().catch(() => ({}));
    const playerId = typeof body?.playerId === "string" ? body.playerId.trim() : "";
    const recoveryCode = normalizeRecoveryCode(body?.recoveryCode);
    const name = normalizeQuickScoreEventName(body?.name);
    const eventType = isQuickScoreEventType(body?.eventType) ? body.eventType : "casual";
    const status = isQuickScoreEventStatus(body?.status) ? body.status : "draft";
    const scheduledFor =
      typeof body?.scheduledFor === "string" && body.scheduledFor.trim().length > 0
        ? body.scheduledFor
        : null;

    if (!playerId || !recoveryCode) {
      return NextResponse.json({ error: "Missing player identity." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Event name is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    await requireQuickScoreClubOwner(supabase, clubId, playerId, recoveryCode);

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("ppl_quick_score_events")
      .insert({
        club_id: clubId,
        name,
        event_type: eventType,
        status,
        scheduled_for: scheduledFor,
        settings: {
          created_from: "quick_score_phase_2_event_flow",
        },
        created_at: now,
        updated_at: now,
      })
      .select("id, club_id, name, event_type, status, scheduled_for, settings, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: `Failed to create event: ${error?.message ?? "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event: mapQuickScoreEventRow(data),
    });
  } catch (error) {
    console.error("POST /api/live/quick-score/clubs/[clubId]/events failed:", error);
    const message = error instanceof Error ? error.message : "Unable to create Quick Score event.";
    const status = message === "Invalid player identity" ? 403 : message === "Club not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
