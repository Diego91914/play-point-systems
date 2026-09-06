export type MasterGameStatus = "live" | "playable_preview";
export type MasterGameFamily = "Play Amplified" | "Shot Caddy" | "Quest Caddy";
export type MasterGameLane = "phone" | "course" | "backyard" | "adventure";

export type MasterGameEntry = {
  id: string;
  title: string;
  parentTitle?: string;
  family: MasterGameFamily;
  lane: MasterGameLane;
  status: MasterGameStatus;
  /** Consumer detail page. */
  href: string;
  /** Actual game launch destination. */
  launchHref: string;
  description: string;
};

/**
 * Consumer-facing master inventory across playamplified.com, playpointsystems.com,
 * and shotcaddy.net. This is intentionally separate from commerce/entitlement
 * catalogs so a complete playable-format count cannot drift when storefront
 * packaging changes. Every catalog click first lands on a Play Amplified
 * experience page; launchHref is the actual game destination.
 */
export const MASTER_GAME_CATALOG: readonly MasterGameEntry[] = [
  { id: "chain-reaction", title: "Chain Reaction", family: "Play Amplified", lane: "phone", status: "live", href: "/play-amplified/games/chain-reaction", launchHref: "/games/chain-reaction", description: "Secret-target wordplay built for face-to-face groups." },
  { id: "how-close", title: "How Close Are We?", family: "Play Amplified", lane: "phone", status: "live", href: "/play-amplified/games/how-close", launchHref: "/games/how-close", description: "Predict where the Spotlight Player lands on a 1-to-100 scale." },
  { id: "on-my-list", title: "On My List", family: "Play Amplified", lane: "phone", status: "live", href: "/play-amplified/games/on-my-list", launchHref: "/games/on-my-list", description: "Uncover another player's private ranked list." },
  { id: "inside-man", title: "The Inside Man", family: "Play Amplified", lane: "phone", status: "live", href: "/play-amplified/games/inside-man", launchHref: "/games/inside-man", description: "Social deduction with a hidden player steering missions toward failure." },
  { id: "phone-holdem", title: "Phone Hold'em", family: "Play Amplified", lane: "phone", status: "live", href: "/play-amplified/games/phone-holdem", launchHref: "/games/holdem", description: "Texas Hold'em with each phone acting as a private seat." },

  { id: "shot-classic", title: "Classic", parentTitle: "Shot Caddy", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/shot-classic", launchHref: "https://shotcaddy.net/mode/classic?variant=CLASSIC", description: "Core challenge-based disc-golf play." },
  { id: "shot-chaos", title: "Chaos", parentTitle: "Shot Caddy", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/shot-chaos", launchHref: "https://shotcaddy.net/mode/classic?variant=CHAOS", description: "Classic play with disruptive powers and bigger swings." },
  { id: "battle-mode", title: "Battle Mode", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/battle-mode", launchHref: "https://shotcaddy.net/mode/battle", description: "Tokens, tactics, and momentum on every hole." },
  { id: "call-your-score", title: "Call Your Score", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/call-your-score", launchHref: "https://shotcaddy.net/mode/cys", description: "Call the result before the hole, then back up the prediction." },
  { id: "challenge-skins-pro", title: "Challenge Skins Pro", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/challenge-skins-pro", launchHref: "https://shotcaddy.net/mode/csp", description: "A focused challenge winner on every hole." },
  { id: "wolf", title: "Wolf", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/wolf", launchHref: "https://shotcaddy.net/mode/wolf", description: "Rotating alliances, partner decisions, and Lone Wolf pressure." },
  { id: "redemption-wolf", title: "Redemption Wolf", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/redemption-wolf", launchHref: "https://shotcaddy.net/mode/redemption-wolf", description: "A Wolf variant that gives the trailing player the next strategic opening." },
  { id: "wolf-pack", title: "Wolf Pack", family: "Shot Caddy", lane: "course", status: "live", href: "/play-amplified/games/wolf-pack", launchHref: "https://shotcaddy.net/mode/wolf-pack", description: "Build the only team on the card or hunt the pack alone." },

  { id: "card-shark-classic", title: "Card Shark · Classic", parentTitle: "Card Shark", family: "Shot Caddy", lane: "backyard", status: "live", href: "/play-amplified/games/card-shark-classic", launchHref: "https://shotcaddy.net/mode/card-shark", description: "Earn playing cards through successful attempts and build the best hand." },
  { id: "card-shark-stud", title: "Card Shark · Stud", parentTitle: "Card Shark", family: "Shot Caddy", lane: "backyard", status: "live", href: "/play-amplified/games/card-shark-stud", launchHref: "https://shotcaddy.net/mode/card-shark", description: "Stud-style Card Shark with cards earned through live play." },
  { id: "card-shark-draw", title: "Card Shark · Draw", parentTitle: "Card Shark", family: "Shot Caddy", lane: "backyard", status: "live", href: "/play-amplified/games/card-shark-draw", launchHref: "https://shotcaddy.net/mode/card-shark", description: "Draw-style Card Shark with a live replacement-card decision." },
  { id: "atw-ladder", title: "Around The World · Ladder", parentTitle: "Around The World", family: "Shot Caddy", lane: "backyard", status: "live", href: "/play-amplified/games/atw-ladder", launchHref: "https://shotcaddy.net/mode/around-the-world", description: "Clear stations in order around a single basket." },
  { id: "atw-sprint", title: "Around The World · Sprint", parentTitle: "Around The World", family: "Shot Caddy", lane: "backyard", status: "live", href: "/play-amplified/games/atw-sprint", launchHref: "https://shotcaddy.net/mode/around-the-world", description: "A faster station-race format." },
  { id: "atw-survival", title: "Around The World · Survival", parentTitle: "Around The World", family: "Shot Caddy", lane: "backyard", status: "live", href: "/play-amplified/games/atw-survival", launchHref: "https://shotcaddy.net/mode/around-the-world", description: "Stay alive as Around The World gets harder." },
  { id: "disc-warrior", title: "Disc Warrior", family: "Shot Caddy", lane: "backyard", status: "live", href: "/play-amplified/games/disc-warrior", launchHref: "https://shotcaddy.net/mode/disc-warrior", description: "A six-throw value ladder with modifiers and a Game Master." },

  { id: "quest-digital", title: "Quest Caddy · Digital Adventure", family: "Quest Caddy", lane: "adventure", status: "live", href: "/play-amplified/games/quest-digital", launchHref: "https://shotcaddy.net/mode/quest-caddy/living-rpg", description: "A persistent fantasy Chronicle with no course or discs required." },
  { id: "quest-disc-golf", title: "Quest Caddy · Disc Golf", family: "Quest Caddy", lane: "adventure", status: "live", href: "/play-amplified/games/quest-disc-golf", launchHref: "https://shotcaddy.net/mode/quest-caddy/disc-golf", description: "Real throws shape the fantasy Chronicle and its consequences." },

  { id: "last-call", title: "Last Call: Murder at Blackwood House", family: "Play Amplified", lane: "phone", status: "playable_preview", href: "/play-amplified/games/last-call", launchHref: "/games/mystery", description: "A phone-powered murder mystery for 4–8 players." },
  { id: "play-point-trivia", title: "Play Point Trivia", family: "Play Amplified", lane: "phone", status: "playable_preview", href: "/play-amplified/games/play-point-trivia", launchHref: "/games/trivia", description: "Hosted group trivia with room codes, teams, wagers, and live scoreboards." },
] as const;

export const FINISHED_GAME_FORMATS = MASTER_GAME_CATALOG.filter((game) => game.status === "live");
export const PREVIEW_GAME_FORMATS = MASTER_GAME_CATALOG.filter((game) => game.status === "playable_preview");
export const FINISHED_GAME_FORMAT_COUNT = FINISHED_GAME_FORMATS.length;
export const PREVIEW_GAME_FORMAT_COUNT = PREVIEW_GAME_FORMATS.length;

export function getMasterGamesByLane(lane: MasterGameLane) {
  return MASTER_GAME_CATALOG.filter((game) => game.lane === lane);
}
