export type PlayPointBrand =
  | "Play Point Social"
  | "Play Point"
  | "Score Caddy"
  | "Shot Caddy"
  | "Quest Caddy";

export type PlayPointProductType =
  | "utility"
  | "standalone_game"
  | "mode"
  | "mini_game"
  | "premium_experience";

export type PlayPointCategory =
  | "social"
  | "disc_golf"
  | "golf"
  | "backyard"
  | "cards"
  | "trivia"
  | "adventure";

export type PlayPointProductStatus =
  | "playable_preview"
  | "live"
  | "building"
  | "concept";

export type PlayPointGameCatalogItem = {
  sku: string;
  title: string;
  /** @deprecated Use brand and playCategories for new UI. */
  family: "Play Point Games" | "Shot Caddy";
  brand: PlayPointBrand;
  productType: PlayPointProductType;
  playCategories: readonly PlayPointCategory[];
  status: PlayPointProductStatus;
  purchasable: boolean;
  priceUsd: number | null;
  includedIn: readonly string[];
  description: string;
  href: string;
  external: boolean;
  badge: string;
  ownershipAuthority: "play_point" | "shot_caddy";
};

export const PLAY_POINT_GAME_CATALOG: readonly PlayPointGameCatalogItem[] = [
  {
    sku: "game.chain_reaction",
    title: "Chain Reaction",
    family: "Play Point Games",
    brand: "Play Point Social",
    productType: "standalone_game",
    playCategories: ["social"],
    status: "playable_preview",
    purchasable: false,
    priceUsd: null,
    includedIn: [],
    description: "A face-to-face secret-target word game where one player quietly steers the table toward a hidden word.",
    href: "/games/chain-reaction",
    external: false,
    badge: "Playable preview",
    ownershipAuthority: "play_point",
  },
  {
    sku: "game.how_close",
    title: "How Close Are We?",
    family: "Play Point Games",
    brand: "Play Point Social",
    productType: "standalone_game",
    playCategories: ["social"],
    status: "playable_preview",
    purchasable: false,
    priceUsd: null,
    includedIn: [],
    description: "One Spotlight Player secretly answers a 1-to-100 question while everyone else predicts where that person lands.",
    href: "/games/how-close",
    external: false,
    badge: "Playable preview",
    ownershipAuthority: "play_point",
  },
  {
    sku: "game.on_my_list",
    title: "On My List",
    family: "Play Point Games",
    brand: "Play Point Social",
    productType: "standalone_game",
    playCategories: ["social"],
    status: "playable_preview",
    purchasable: false,
    priceUsd: null,
    includedIn: [],
    description: "One player builds a private ranked board of 5 to 10 answers while everyone else tries to uncover the list.",
    href: "/games/on-my-list",
    external: false,
    badge: "Playable preview",
    ownershipAuthority: "play_point",
  },
  {
    sku: "game.inside_man",
    title: "The Inside Man",
    family: "Play Point Games",
    brand: "Play Point Social",
    productType: "standalone_game",
    playCategories: ["social"],
    status: "playable_preview",
    purchasable: false,
    priceUsd: null,
    includedIn: [],
    description: "A phone-powered social deduction game: complete group missions while one hidden player secretly steers the table toward failure.",
    href: "/games/inside-man",
    external: false,
    badge: "Playable preview",
    ownershipAuthority: "play_point",
  },
  {
    sku: "game.phone_holdem",
    title: "Phone Hold'em",
    family: "Play Point Games",
    brand: "Play Point",
    productType: "standalone_game",
    playCategories: ["cards"],
    status: "playable_preview",
    purchasable: false,
    priceUsd: null,
    includedIn: [],
    description: "Face-to-face Texas Hold'em where every phone is a private seat and the table software handles cards, chips, betting, side pots, and tournaments.",
    href: "/games/holdem",
    external: false,
    badge: "Playable preview",
    ownershipAuthority: "play_point",
  },
  {
    sku: "game.play_point_trivia",
    title: "Play Point Trivia",
    family: "Play Point Games",
    brand: "Play Point",
    productType: "standalone_game",
    playCategories: ["trivia"],
    status: "playable_preview",
    purchasable: false,
    priceUsd: null,
    includedIn: [],
    description: "Hosted group trivia built around room codes, phones, shared scoreboards, pacing controls, teams, wagers, and live competition.",
    href: "/games/trivia",
    external: false,
    badge: "Playable preview",
    ownershipAuthority: "play_point",
  },
  {
    sku: "shot_caddy.mode.classic",
    title: "Shot Caddy Classic",
    family: "Shot Caddy",
    brand: "Shot Caddy",
    productType: "mode",
    playCategories: ["disc_golf"],
    status: "live",
    purchasable: false,
    priceUsd: null,
    includedIn: ["shot_caddy"],
    description: "The core Shot Caddy disc-golf experience with challenge packs, tokens, Special Plays, and real-round scoring.",
    href: "https://shotcaddy.net/mode/classic",
    external: true,
    badge: "Shot Caddy",
    ownershipAuthority: "shot_caddy",
  },
  {
    sku: "shot_caddy.mode.battle",
    title: "Shot Caddy Battle",
    family: "Shot Caddy",
    brand: "Shot Caddy",
    productType: "mode",
    playCategories: ["disc_golf"],
    status: "live",
    purchasable: false,
    priceUsd: null,
    includedIn: ["shot_caddy"],
    description: "Competitive Shot Caddy play where challenges, tokens, Special Plays, and Battle Points turn the round into a head-to-head game.",
    href: "https://shotcaddy.net/mode/battle",
    external: true,
    badge: "Shot Caddy",
    ownershipAuthority: "shot_caddy",
  },
  {
    sku: "shot_caddy.mode.csp",
    title: "Challenge Skins Pro",
    family: "Shot Caddy",
    brand: "Shot Caddy",
    productType: "standalone_game",
    playCategories: ["disc_golf", "golf"],
    status: "live",
    purchasable: false,
    priceUsd: null,
    includedIn: ["shot_caddy"],
    description: "Challenge-driven skins competition for disc golf and golf, powered by Shot Caddy.",
    href: "https://shotcaddy.net/mode/csp",
    external: true,
    badge: "Shot Caddy",
    ownershipAuthority: "shot_caddy",
  },
] as const;

export const PLAY_POINT_GAME_SKUS = new Set(PLAY_POINT_GAME_CATALOG.map((game) => game.sku));

export function getCatalogByCategory(category: PlayPointCategory) {
  return PLAY_POINT_GAME_CATALOG.filter((product) => product.playCategories.includes(category));
}

export function getCatalogByBrand(brand: PlayPointBrand) {
  return PLAY_POINT_GAME_CATALOG.filter((product) => product.brand === brand);
}
