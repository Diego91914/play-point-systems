import { QUICK_SCORE_GAMES, type QuickScoreGameId } from "./quick-score";

export type QuickScoreClubStatus = "active" | "archived";
export type QuickScoreClubParticipantStatus = "active" | "inactive";
export type QuickScoreEventType = "casual" | "league_night" | "tournament" | "championship";
export type QuickScoreEventStatus = "draft" | "live" | "complete" | "archived";
export type QuickScoreMatchStatus = "scheduled" | "live" | "complete" | "void";

export type QuickScoreClubRecord = {
  id: string;
  ownerPlayerId: string;
  name: string;
  slug: string;
  status: QuickScoreClubStatus;
  sportKeys: QuickScoreGameId[];
  locationLabel: string | null;
  notes: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type QuickScoreClubSummary = QuickScoreClubRecord & {
  participantCount: number;
};

export type QuickScoreClubParticipantRecord = {
  id: string;
  clubId: string;
  displayName: string;
  normalizedName: string;
  aliases: string[];
  status: QuickScoreClubParticipantStatus;
  createdAt: string;
  updatedAt: string;
};

export type QuickScoreClubDetail = {
  club: QuickScoreClubSummary;
  participants: QuickScoreClubParticipantRecord[];
};

export type QuickScoreEventRecord = {
  id: string;
  clubId: string;
  name: string;
  eventType: QuickScoreEventType;
  status: QuickScoreEventStatus;
  scheduledFor: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type QuickScoreMatchRecord = {
  id: string;
  clubId: string;
  eventId: string | null;
  quickScoreSessionCode: string | null;
  sportKey: QuickScoreGameId;
  formatKey: string | null;
  participantIds: string[];
  teamLabels: string[] | null;
  winnerParticipantIds: string[] | null;
  winningLabel: string | null;
  status: QuickScoreMatchStatus;
  startedAt: string | null;
  completedAt: string | null;
  summary: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

const QUICK_SCORE_GAME_ID_SET = new Set<QuickScoreGameId>(QUICK_SCORE_GAMES.map((game) => game.id));

export function isQuickScoreClubStatus(value: unknown): value is QuickScoreClubStatus {
  return value === "active" || value === "archived";
}

export function isQuickScoreClubParticipantStatus(value: unknown): value is QuickScoreClubParticipantStatus {
  return value === "active" || value === "inactive";
}

export function isQuickScoreEventType(value: unknown): value is QuickScoreEventType {
  return value === "casual" || value === "league_night" || value === "tournament" || value === "championship";
}

export function isQuickScoreEventStatus(value: unknown): value is QuickScoreEventStatus {
  return value === "draft" || value === "live" || value === "complete" || value === "archived";
}

export function isQuickScoreMatchStatus(value: unknown): value is QuickScoreMatchStatus {
  return value === "scheduled" || value === "live" || value === "complete" || value === "void";
}

export function normalizeQuickScoreClubName(value: unknown, maxLength = 80): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function normalizeQuickScoreClubSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized || "club";
}

export function buildUniqueQuickScoreClubSlug(baseSlug: string, usedSlugs: Iterable<string>): string {
  const slugSet = new Set(Array.from(usedSlugs, (slug) => slug.trim().toLowerCase()).filter(Boolean));
  const normalizedBase = normalizeQuickScoreClubSlug(baseSlug);

  if (!slugSet.has(normalizedBase)) {
    return normalizedBase;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${normalizedBase}-${suffix}`;
    if (!slugSet.has(candidate)) {
      return candidate;
    }
  }

  return `${normalizedBase}-${Date.now().toString(36)}`;
}

export function sanitizeQuickScoreClubSportKeys(value: unknown): QuickScoreGameId[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<QuickScoreGameId>();

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim().toUpperCase() : ""))
    .filter((entry): entry is QuickScoreGameId => QUICK_SCORE_GAME_ID_SET.has(entry as QuickScoreGameId))
    .filter((entry) => {
      if (seen.has(entry)) return false;
      seen.add(entry);
      return true;
    });
}

export function normalizeQuickScoreClubParticipantName(value: unknown, maxLength = 80): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function normalizeQuickScoreClubParticipantKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function sanitizeQuickScoreClubAliases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();

  return value
    .map((entry) => normalizeQuickScoreClubParticipantName(entry, 80))
    .filter((entry): entry is string => entry != null)
    .filter((entry) => {
      const key = normalizeQuickScoreClubParticipantKey(entry);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function sanitizeQuickScoreClubNotes(value: unknown, maxLength = 600): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function sanitizeQuickScoreClubLocation(value: unknown, maxLength = 120): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function normalizeQuickScoreEventName(value: unknown, maxLength = 120): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function sanitizeQuickScoreMatchTeamLabels(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const next = value
    .map((entry) => normalizeQuickScoreClubParticipantName(entry, 80))
    .filter((entry): entry is string => entry != null);
  return next.length > 0 ? next : null;
}

export function mapQuickScoreClubRow(row: Record<string, unknown>, participantCount = 0): QuickScoreClubSummary {
  return {
    id: String(row.id ?? ""),
    ownerPlayerId: String(row.owner_player_id ?? ""),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    status: row.status === "archived" ? "archived" : "active",
    sportKeys: sanitizeQuickScoreClubSportKeys(Array.isArray(row.sport_keys) ? row.sport_keys : []),
    locationLabel: typeof row.location_label === "string" ? row.location_label : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    settings: row.settings && typeof row.settings === "object" && !Array.isArray(row.settings) ? (row.settings as Record<string, unknown>) : {},
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    participantCount,
  };
}

export function mapQuickScoreClubParticipantRow(row: Record<string, unknown>): QuickScoreClubParticipantRecord {
  return {
    id: String(row.id ?? ""),
    clubId: String(row.club_id ?? ""),
    displayName: String(row.display_name ?? ""),
    normalizedName: String(row.normalized_name ?? ""),
    aliases: Array.isArray(row.aliases) ? row.aliases.filter((entry): entry is string => typeof entry === "string") : [],
    status: row.status === "inactive" ? "inactive" : "active",
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapQuickScoreEventRow(row: Record<string, unknown>): QuickScoreEventRecord {
  return {
    id: String(row.id ?? ""),
    clubId: String(row.club_id ?? ""),
    name: String(row.name ?? ""),
    eventType: isQuickScoreEventType(row.event_type) ? row.event_type : "casual",
    status: isQuickScoreEventStatus(row.status) ? row.status : "draft",
    scheduledFor: typeof row.scheduled_for === "string" ? row.scheduled_for : null,
    settings: row.settings && typeof row.settings === "object" && !Array.isArray(row.settings) ? (row.settings as Record<string, unknown>) : {},
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapQuickScoreMatchRow(row: Record<string, unknown>): QuickScoreMatchRecord {
  return {
    id: String(row.id ?? ""),
    clubId: String(row.club_id ?? ""),
    eventId: typeof row.event_id === "string" ? row.event_id : null,
    quickScoreSessionCode: typeof row.quick_score_session_code === "string" ? row.quick_score_session_code : null,
    sportKey: QUICK_SCORE_GAME_ID_SET.has(row.sport_key as QuickScoreGameId)
      ? (row.sport_key as QuickScoreGameId)
      : "GENERIC_POINTS",
    formatKey: typeof row.format_key === "string" ? row.format_key : null,
    participantIds: Array.isArray(row.participant_ids)
      ? row.participant_ids.filter((entry): entry is string => typeof entry === "string")
      : [],
    teamLabels: Array.isArray(row.team_labels)
      ? row.team_labels.filter((entry): entry is string => typeof entry === "string")
      : null,
    winnerParticipantIds: Array.isArray(row.winner_participant_ids)
      ? row.winner_participant_ids.filter((entry): entry is string => typeof entry === "string")
      : null,
    winningLabel: typeof row.winning_label === "string" ? row.winning_label : null,
    status: isQuickScoreMatchStatus(row.status) ? row.status : "scheduled",
    startedAt: typeof row.started_at === "string" ? row.started_at : null,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
    summary: row.summary && typeof row.summary === "object" && !Array.isArray(row.summary) ? (row.summary as Record<string, unknown>) : {},
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
