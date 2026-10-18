export type PlayAmplifiedEventAudience =
  | "corporate"
  | "charity-fundraiser"
  | "church-community"
  | "golf-disc-golf"
  | "customer-appreciation";

export type PlayAmplifiedEventModuleId =
  | "team-csp"
  | "closest-to-pin"
  | "approach-champion"
  | "drive-champion"
  | "clear-the-stack"
  | "company-trivia"
  | "social-game"
  | "custom-challenge";

export type PlayAmplifiedEventTemplate = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  audiences: readonly PlayAmplifiedEventAudience[];
  modules: readonly PlayAmplifiedEventModuleId[];
  idealFor: string;
};

export const PLAY_AMPLIFIED_EVENT_TEMPLATES: readonly PlayAmplifiedEventTemplate[] = [
  {
    id: "corporate-challenge",
    title: "Corporate Challenge",
    eyebrow: "Team engagement",
    description:
      "A multi-game team event with QR entry, balanced teams, live standings, rotating challenges, and one overall event champion.",
    audiences: ["corporate", "customer-appreciation"],
    modules: ["company-trivia", "social-game", "custom-challenge", "clear-the-stack"],
    idealFor: "Employee outings, leadership retreats, customer events, and team-building days.",
  },
  {
    id: "shot-caddy-event-kit",
    title: "Shot Caddy Event Kit",
    eyebrow: "Disc golf flagship",
    description:
      "The original corporate disc golf event concept, combining team competition, skill championships, QR registration, and live standings.",
    audiences: ["corporate", "charity-fundraiser", "church-community", "golf-disc-golf"],
    modules: ["team-csp", "closest-to-pin", "approach-champion", "drive-champion"],
    idealFor: "Corporate disc golf, charity tournaments, church outings, leagues, and sponsor events.",
  },
  {
    id: "community-fundraiser",
    title: "Community & Fundraiser",
    eyebrow: "Play for a purpose",
    description:
      "A flexible event shell for church groups, charities, schools, and community organizations with team play, sponsor challenges, and awards.",
    audiences: ["charity-fundraiser", "church-community"],
    modules: ["social-game", "company-trivia", "custom-challenge", "clear-the-stack"],
    idealFor: "Fundraisers, church outings, community days, and volunteer appreciation events.",
  },
];

export const SHOT_CADDY_EVENT_KIT = {
  recommendedGroup: "6 players / 3 two-person teams",
  championships: [
    { hole: "Par 3", competition: "Closest to the Pin" },
    { hole: "Par 4", competition: "Approach Champion" },
    { hole: "Par 5", competition: "Drive Champion" },
  ],
} as const;

export const PLAY_AMPLIFIED_EVENT_FOUNDATION = {
  promise: "One event. One join point. Multiple ways to play. One shared result.",
  capabilities: [
    "QR-code registration",
    "Automatic team balancing",
    "Live individual and team leaderboards",
    "Cross-game event points",
    "Corporate and sponsor challenges",
    "Team and individual championships",
  ],
} as const;
