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
    status: "bridge",
    summary: "One Play Amplified identity layer for hosts and players across products.",
    currentOwner: "Play Amplified session layer with a temporary pre-launch Shot Caddy account bridge.",
    nextMove: "Retire the temporary bridge once Founder and launch accounts resolve directly through Play Amplified auth.",
  },
  {
    id: "user-profiles",
    label: "User Profiles",
    status: "planned",
    summary: "Persistent player cards, stats, achievements, and product-level identity.",
    currentOwner: "Local session-specific player records only.",
    nextMove: "Move to Play Point Core profile records shared by Play Amplified experiences.",
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
    summary: "Hosted live-session containers already exist in Trivia and legacy live-experience flows.",
    currentOwner: "Trivia runtime in Play Point Systems and live-board runtime in the Shot Caddy zone.",
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
    summary: "Legacy live-experience code contains achievement logic that still lives in the Shot Caddy runtime zone.",
    currentOwner: "Shot Caddy zone legacy helpers.",
    nextMove: "Rehome achievement definitions into Core and let products award them through adapters.",
  },
  {
    id: "play-points",
    label: "Play Points",
    status: "bridge",
    summary: "The naming and progression concept already exists, but the currency rules are not centralized yet.",
    currentOwner: "Legacy live-board and session helpers.",
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
    summary: "QR-based room or event entry already exists across Play Amplified experiences.",
    currentOwner: "Runtime-specific handlers.",
    nextMove: "Keep one shared concept with per-product join destinations under playamplified.com.",
  },
  {
    id: "tv-mode",
    label: "TV Mode",
    status: "bridge",
    summary: "Hosted display surfaces already exist, but each product renders them independently.",
    currentOwner: "Trivia host board and legacy live-board TV mode.",
    nextMove: "Establish a reusable hosted-display shell inside Core.",
  },
] as const;

export const PLAY_POINT_PRODUCT_BOUNDARIES: readonly PlayPointProductBoundary[] = [
  {
    product: "Shot Caddy",
    domain: "playamplified.com/shot-caddy",
    focus: "Disc golf, ball golf overlays, and golf-specific games and organizer tools.",
    currentRuntime: "Runs as the separately deployable Shot Caddy zone while Play Amplified owns the public origin, account journey, storefront, and canonical URLs.",
  },
  {
    product: "Play Amplified",
    domain: "playamplified.com",
    focus: "Consumer storefront, social games, golf games, adventures, accounts, purchases, and guest joins.",
    currentRuntime: "Public source of truth and parent runtime; mounts the Shot Caddy zone at /shot-caddy during migration.",
  },
  {
    product: "Play Point Core",
    domain: "Internal shared platform layer",
    focus: "Auth, identities, clubs, seasons, events, contests, progression, QR join, and hosted-display primitives.",
    currentRuntime: "Shared contracts and services that keep product-specific engines from duplicating platform concerns.",
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
    goal: "Put every consumer experience under the Play Amplified public origin without destabilizing mature game engines.",
    actions: [
      "Make playamplified.com the public source of truth.",
      "Mount Shot Caddy under /shot-caddy as a separately deployable zone.",
      "Preserve shotcaddy.net only as a permanent legacy redirect domain.",
    ],
  },
  {
    phase: "Phase 2",
    goal: "Centralize account, entitlement, storefront, and joining behavior while keeping gameplay engines modular.",
    actions: [
      "Retire cross-domain account handoffs and provider-specific game access checks.",
      "Route all QR and shared links through playamplified.com.",
      "Keep purchase-provider details outside individual game code.",
    ],
  },
  {
    phase: "Phase 3",
    goal: "Promote identities, clubs, seasons, and progression into a shared operational layer.",
    actions: [
      "Add persistent auth, profiles, clubs, and season records.",
      "Centralize Play Points, achievements, notifications, and cross-product player cards.",
      "Retire migration-only bridge code once the Play Amplified account model is fully authoritative.",
    ],
  },
] as const;
