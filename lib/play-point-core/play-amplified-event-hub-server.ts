import "server-only";

import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { AMPLIFIED_EVENT_TABLES, loadOwnedAmplifiedEvent } from "@/lib/play-point-core/play-amplified-event-server";
import {
  buildAmplifiedEventStandings,
  latestAmplifiedActivityResults,
  type PlayAmplifiedStoredResult,
} from "@/lib/play-point-core/play-amplified-event-scoring";

export const AMPLIFIED_EVENT_RESULTS_TABLE = "ppl_amplified_event_results";

function publicCode(value: string) {
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{6,8}$/.test(code) ? code : null;
}

async function loadResultRows(eventId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(AMPLIFIED_EVENT_RESULTS_TABLE)
    .select("activity_id,result_version,entity_type,team_id,participant_id,placement,raw_score,score_label,event_points,source,source_ref")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as PlayAmplifiedStoredResult[];
}

export async function loadOwnedAmplifiedEventHub(eventId: string, ownerUserId: string) {
  const event = await loadOwnedAmplifiedEvent(eventId, ownerUserId);
  if (!event) return null;
  const results = await loadResultRows(eventId);
  const teamMembers = event.teams.flatMap((team) => team.participantIds.map((participantId) => ({
    team_id: team.id,
    participant_id: participantId,
  })));
  const standings = buildAmplifiedEventStandings({
    teams: event.teams,
    participants: event.participants,
    teamMembers,
    results,
  });
  return {
    ...event,
    ...standings,
    completedActivities: event.activities.filter((activity) => activity.status === "complete").length,
  };
}

export async function loadPublicAmplifiedEventHubByCode(rawCode: string) {
  const code = publicCode(rawCode);
  if (!code) return null;
  const supabase = getSupabaseServerClient();
  const { data: event, error: eventError } = await supabase
    .from(AMPLIFIED_EVENT_TABLES.events)
    .select("id,name,event_date,status,join_code,registration_open,published_at,started_at,completed_at")
    .eq("join_code", code)
    .in("status", ["published", "live", "complete"])
    .maybeSingle();
  if (eventError) throw new Error(eventError.message);
  if (!event) return null;

  const [{ data: participants, error: participantError }, { data: activities, error: activityError }, { data: teams, error: teamError }, results] = await Promise.all([
    supabase.from(AMPLIFIED_EVENT_TABLES.participants).select("id,display_name,skill,checked_in").eq("event_id", event.id).order("display_name"),
    supabase.from(AMPLIFIED_EVENT_TABLES.activities).select("id,module_id,name,sort_order,status").eq("event_id", event.id).order("sort_order"),
    supabase.from(AMPLIFIED_EVENT_TABLES.teams).select("id,name,sort_order,total_skill").eq("event_id", event.id).order("sort_order"),
    loadResultRows(event.id),
  ]);
  if (participantError) throw new Error(participantError.message);
  if (activityError) throw new Error(activityError.message);
  if (teamError) throw new Error(teamError.message);

  const teamRows = teams ?? [];
  let teamMembers: Array<{ team_id: string; participant_id: string }> = [];
  if (teamRows.length) {
    const { data, error } = await supabase
      .from(AMPLIFIED_EVENT_TABLES.teamMembers)
      .select("team_id,participant_id")
      .in("team_id", teamRows.map((team) => team.id));
    if (error) throw new Error(error.message);
    teamMembers = data ?? [];
  }

  const participantRows = (participants ?? []).map((participant) => ({
    id: participant.id,
    name: participant.display_name,
    skill: participant.skill,
    checkedIn: participant.checked_in,
    teamId: teamMembers.find((member) => member.participant_id === participant.id)?.team_id ?? null,
  }));
  const activityRows = activities ?? [];
  const standings = buildAmplifiedEventStandings({
    teams: teamRows,
    participants: participantRows,
    teamMembers,
    results,
  });
  const latest = latestAmplifiedActivityResults(results);

  return {
    event,
    teams: teamRows.map((team) => ({
      ...team,
      participantIds: teamMembers.filter((member) => member.team_id === team.id).map((member) => member.participant_id),
    })),
    participants: participantRows,
    activities: activityRows.map((activity) => ({
      ...activity,
      results: latest
        .filter((result) => result.activity_id === activity.id)
        .map((result) => ({
          entityType: result.entity_type,
          entityId: result.team_id ?? result.participant_id,
          placement: result.placement,
          scoreLabel: result.score_label,
          eventPoints: result.event_points,
          source: result.source,
        })),
    })),
    teamStandings: standings.teamStandings,
    individualStandings: standings.individualStandings,
    completedActivities: activityRows.filter((activity) => activity.status === "complete").length,
    totalActivities: activityRows.length,
  };
}
