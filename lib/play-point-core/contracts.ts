export type PlayPointCapabilityStatus = "live" | "bridge" | "planned";

export type PlayPointCapabilityId =
  | "authentication"
  | "user-profiles"
  | "clubs"
  | "seasons"
  | "events"
  | "contests"
  | "leaderboards"
  | "achievements"
  | "play-points"
  | "notifications"
  | "qr-joining"
  | "tv-mode";

export interface PlayPointCapability {
  id: PlayPointCapabilityId;
  label: string;
  status: PlayPointCapabilityStatus;
  summary: string;
  currentOwner: string;
  nextMove: string;
}

export interface PlayPointProductBoundary {
  product: string;
  domain: string;
  focus: string;
  currentRuntime: string;
}

export interface PlayPointSurface {
  title: string;
  summary: string;
  examples: readonly string[];
}

export interface PlayPointMigrationPhase {
  phase: string;
  goal: string;
  actions: readonly string[];
}

export const PLAY_POINT_CORE_CAPABILITIES: readonly PlayPointCapability[] = [
  {
    id: "authentication",
    label: "Authentication",
    status: "planned",
    summary: "One identity layer for hosts, commissioners, venue staff, and players across products.",
    currentOwner: "Split between product-specific access gates today.",
    nextMove: "Promote into a shared Play Point Core auth and role model.",
  },
  {
    id: "user-profiles",
    label: "User Profiles",
    status: "planned",
    summary: "Persistent player cards, stats, achievements, and product-level identity.",
    currentOwner: "Local session-specific player records only.",
    nextMove: "Move to Play Point Core profile records shared by Live, Trivia, and future products.",
  },
  {
    id: "clubs",
    label: "Clubs",
    status: "planned",
    summary: "Permanent groups for friends, venues, offices, churches, and recurring communities.",
    currentOwner: "Not centralized yet.",
    nextMove: "Add as the long-lived community container above leagues and seasons.",
  },
  {
    id: "seasons",
    label: "Seasons",
    status: "planned",
    summary: "Configurable season structures for weekly play, playoffs, and championships.",
    currentOwner: "Not centralized yet.",
    nextMove: "Build once in Core so every sport template can reuse the same season engine.",
  },
  {
    id: "events",
    label: "Events",
    status: "live",
    summary: "Hosted live-session containers already exist in Trivia and legacy Play Point Live flows.",
    currentOwner: "Trivia runtime in Play Point Systems and live-board runtime in Shot Caddy.",
    nextMove: "Converge on one shared event contract under Play Point Core.",
  },
  {
    id: "contests",
    label: "Contests",
    status: "bridge",
    summary: "Trivia rounds and live boards already act like contest templates, but they are product-specific.",
    currentOwner: "Separate per-product runtime models.",
    nextMove: "Normalize template families such as assignment, prediction, bracket, and live challenges.",
  },
  {
    id: "leaderboards",
    label: "Leaderboards",
    status: "live",
    summary: "Per-session scoreboards already exist in Trivia and Shot Caddy event tooling.",
    currentOwner: "Product-specific runtime state.",
    nextMove: "Introduce shared event, venue, club, and season leaderboard views.",
  },
  {
    id: "achievements",
    label: "Achievements",
    status: "bridge",
    summary: "Legacy Play Point Live contains achievement logic, but it still lives inside Shot Caddy.",
    currentOwner: "Shot Caddy legacy helpers.",
    nextMove: "Rehome achievement definitions into Core and let products award them through adapters.",
  },
  {
    id: "play-points",
    label: "Play Points",
    status: "bridge",
    summary: "The naming and progression concept already exists, but the currency rules are not centralized yet.",
    currentOwner: "Legacy Play Point Live board and session helpers.",
    nextMove: "Define one progression currency model in Core with product-specific earn rules.",
  },
  {
    id: "notifications",
    label: "Notifications",
    status: "planned",
    summary: "Join alerts, weekly reminders, rivalry nudges, and event-start prompts.",
    currentOwner: "Not centralized yet.",
    nextMove: "Implement after clubs, seasons, and profile identity are shared.",
  },
  {
    id: "qr-joining",
    label: "QR Joining",
    status: "live",
    summary: "QR-based room or event entry already exists in Trivia and live-board flows.",
    currentOwner: "Runtime-specific handlers.",
    nextMove: "Keep one shared concept with per-product join destinations.",
  },
  {
    id: "tv-mode",
    label: "TV Mode",
    status: "bridge",
    summary: "Hosted display surfaces already exist, but each product renders them independently.",
    currentOwner: "Trivia host board in Play Point Systems and live-board TV mode in Shot Caddy.",
    nextMove: "Establish a reusable hosted-display shell inside Core.",
  },
] as const;

export const PLAY_POINT_PRODUCT_BOUNDARIES: readonly PlayPointProductBoundary[] = [
  {
    product: "Shot Caddy",
    domain: "shotcaddy.net",
    focus: "Disc golf, ball golf overlays, and golf-specific organizer tools.",
    currentRuntime: "Owns golf-specific gameplay and no longer owns Quick Score or Play Point Live.",
  },
  {
    product: "Play Point Live",
    domain: "playpointsystems.com/live",
    focus: "Multi-sport live experiences, fast scoreboards, venues, clubs, and seasons.",
    currentRuntime: "Quick Score is native here; only the older board MVP still bridges through Shot Caddy.",
  },
  {
    product: "Play Point Core",
    domain: "Internal shared platform layer",
    focus: "Auth, identities, clubs, seasons, events, contests, progression, QR join, and TV shell.",
    currentRuntime: "Documented and started here so new work lands in the right architecture.",
  },
] as const;

export const PLAY_POINT_LIVE_SURFACES: readonly PlayPointSurface[] = [
  {
    title: "Quick Score",
    summary: "A fast, no-login scoreboard for backyard games, casual competition, and club nights.",
    examples: ["Cornhole, bocce, and horseshoes", "QR spectator boards", "Club and event match history"],
  },
  {
    title: "Venue Nights",
    summary: "Hosted experiences for bars, restaurants, fundraisers, and public watch parties.",
    examples: ["Football squares and score boards", "Trivia nights", "Sponsor-backed promotions"],
  },
  {
    title: "Private Clubs",
    summary: "Persistent friend groups that create leagues, rivalries, and repeat use outside a public venue.",
    examples: ["Family football league", "Office NASCAR club", "Church multi-sport challenge"],
  },
  {
    title: "Season Play",
    summary: "Recurring schedules that turn events into long-term standings, streaks, trophies, and championships.",
    examples: ["Weekly pick'em", "Driver shuffle season", "March Madness bracket season"],
  },
] as const;

export const PLAY_POINT_MIGRATION_PHASES: readonly PlayPointMigrationPhase[] = [
  {
    phase: "Phase 1",
    goal: "Put the product architecture in the right home without breaking the current runtime.",
    actions: [
      "Make Play Point Systems the public source of truth for Play Point Live.",
      "Create shared platform contracts in Play Point Core.",
      "Move Quick Score into Play Point Live and keep Shot Caddy golf-first.",
    ],
  },
  {
    phase: "Phase 2",
    goal: "Build new multi-sport runtime work on Play Point Systems and keep Shot Caddy in its golf-specific lane.",
    actions: [
      "Rebuild live event creation on top of Play Point Core contracts.",
      "Port reusable TV mode and QR join patterns into shared utilities.",
      "Expose adapters for existing Trivia and future Play Point Live contest templates.",
    ],
  },
  {
    phase: "Phase 3",
    goal: "Promote identities, clubs, seasons, and progression into a shared operational layer.",
    actions: [
      "Add persistent auth, profiles, clubs, and season records.",
      "Centralize Play Points, achievements, notifications, and cross-product player cards.",
      "Retire Shot Caddy bridge routes once the new runtime is live on Play Point Systems.",
    ],
  },
] as const;
