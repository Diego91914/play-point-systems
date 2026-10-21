import "server-only";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { buildEventRunOfPlay, normalizeEventSkill } from "@/lib/play-point-core/play-amplified-event-organizer";
import { PLAY_AMPLIFIED_EVENT_TEMPLATES } from "@/lib/play-point-core/play-amplified-events";

export const AMPLIFIED_EVENT_TABLES = {
  events: "ppl_amplified_events",
  participants: "ppl_amplified_event_participants",
  activities: "ppl_amplified_event_activities",
  teams: "ppl_amplified_event_teams",
  teamMembers: "ppl_amplified_event_team_members",
} as const;

export type AmplifiedEventDraftInput = {
  templateId: string;
  name: string;
  eventDate: string | null;
  teamCount: number;
  participants: Array<{ id?: string; name: string; skill: number }>;
};

export async function getAmplifiedEventAccount() {
  const store = await cookies();
  return verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);
}

export function normalizeAmplifiedEventDraft(body: unknown): AmplifiedEventDraftInput {
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const requestedTemplate = String(raw.templateId ?? "");
  const template = PLAY_AMPLIFIED_EVENT_TEMPLATES.find((item) => item.id === requestedTemplate) ?? PLAY_AMPLIFIED_EVENT_TEMPLATES[0];
  const name = String(raw.name ?? "").trim().slice(0, 120) || template.title;
  const eventDateRaw = String(raw.eventDate ?? "");
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(eventDateRaw) ? eventDateRaw : null;
  const teamCount = Math.max(1, Math.min(8, Math.floor(Number(raw.teamCount) || 3)));
  const participants = (Array.isArray(raw.participants) ? raw.participants : [])
    .slice(0, 500)
    .map((item) => {
      const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return {
        id: String(row.id ?? "") || undefined,
        name: String(row.name ?? "").trim().slice(0, 100),
        skill: normalizeEventSkill(Number(row.skill)),
      };
    })
    .filter((item) => item.name);
  return { templateId: template.id, name, eventDate, teamCount, participants };
}

export function amplifiedEventDraftPayload(draft: AmplifiedEventDraftInput) {
  const template = PLAY_AMPLIFIED_EVENT_TEMPLATES.find((item) => item.id === draft.templateId) ?? PLAY_AMPLIFIED_EVENT_TEMPLATES[0];
  return { ...draft, activities: buildEventRunOfPlay(template.modules) };
}

export function amplifiedEventErrorStatus(error: { code?: string }) {
  const match = /^PT(400|401|404|409)$/.exec(error.code ?? "");
  return match ? Number(match[1]) : 500;
}

export async function loadOwnedAmplifiedEvent(eventId: string, ownerUserId: string) {
  const supabase = getSupabaseServerClient();
  const tables = AMPLIFIED_EVENT_TABLES;
  const { data: event, error } = await supabase
    .from(tables.events)
    .select("id,template_id,name,event_date,status,join_code,team_count,registration_open,published_at,started_at,created_at,updated_at")
    .eq("id", eventId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) return null;

  const [{ data: participants, error: participantError }, { data: activities, error: activityError }, { data: teams, error: teamError }] = await Promise.all([
    supabase.from(tables.participants).select("id,display_name,skill,source,checked_in,joined_at").eq("event_id", eventId).order("joined_at"),
    supabase.from(tables.activities).select("id,module_id,name,sort_order,status,settings").eq("event_id", eventId).order("sort_order"),
    supabase.from(tables.teams).select("id,name,sort_order,total_skill").eq("event_id", eventId).order("sort_order"),
  ]);
  if (participantError) throw new Error(participantError.message);
  if (activityError) throw new Error(activityError.message);
  if (teamError) throw new Error(teamError.message);

  const teamRows = teams ?? [];
  let teamMembers: Array<{ team_id: string; participant_id: string }> = [];
  if (teamRows.length) {
    const { data, error: memberError } = await supabase
      .from(tables.teamMembers)
      .select("team_id,participant_id")
      .in("team_id", teamRows.map((team) => team.id));
    if (memberError) throw new Error(memberError.message);
    teamMembers = data ?? [];
  }

  return {
    ...event,
    participants: (participants ?? []).map((participant) => ({
      id: participant.id,
      name: participant.display_name,
      skill: participant.skill,
      source: participant.source,
      checkedIn: participant.checked_in,
      joinedAt: participant.joined_at,
    })),
    activities: activities ?? [],
    teams: teamRows.map((team) => ({
      ...team,
      participantIds: teamMembers.filter((member) => member.team_id === team.id).map((member) => member.participant_id),
    })),
  };
}

const JOIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomJoinCode(length = 6) {
  return Array.from({ length }, () => JOIN_ALPHABET[randomInt(0, JOIN_ALPHABET.length)]).join("");
}

export async function generateUniqueAmplifiedEventJoinCode(maxRetries = 12) {
  const supabase = getSupabaseServerClient();
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const code = randomJoinCode();
    const { data, error } = await supabase.from(AMPLIFIED_EVENT_TABLES.events).select("id").eq("join_code", code).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return code;
  }
  throw new Error("Could not generate a unique event join code.");
}
