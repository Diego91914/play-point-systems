export type PlayPointGameCatalogItem = {
  sku: string;
  title: string;
  family: "Play Point Games" | "Shot Caddy";
  description: string;
  href: string;
  external: boolean;
  badge: string;
  ownershipAuthority: "play_point" | "shot_caddy";
};

export const PLAY_POINT_GAME_CATALOG: readonly PlayPointGameCatalogItem[] = [
  { sku:"game.get_there", title:"GET THERE", family:"Play Point Games", description:"A face-to-face conversation game: hide the destination, follow the answers around the table, and decide when to use a road or pass it forever.", href:"/games/get-there", external:false, badge:"Playable preview", ownershipAuthority:"play_point" },
  { sku:"game.chain_reaction", title:"Chain Reaction", family:"Play Point Games", description:"A fast face-to-face family word game: connect each word to the last, defend surprising links, and let the table decide what counts.", href:"/games/chain-reaction", external:false, badge:"Playable preview", ownershipAuthority:"play_point" },
  { sku:"game.how_close", title:"How Close Are We?", family:"Play Point Games", description:"Everyone privately rates the same family-friendly question from 1 to 100, then the table reveals how close their minds really are.", href:"/games/how-close", external:false, badge:"Playable preview", ownershipAuthority:"play_point" },
  { sku:"game.phone_holdem", title:"Phone Hold'em", family:"Play Point Games", description:"Face-to-face Texas Hold'em where every phone is a private seat and the table software handles cards, chips, betting, side pots, and tournaments.", href:"/games/holdem", external:false, badge:"Playable preview", ownershipAuthority:"play_point" },
  { sku:"game.play_point_trivia", title:"Play Point Trivia", family:"Play Point Games", description:"Hosted group trivia built around room codes, phones, shared scoreboards, pacing controls, teams, wagers, and live competition.", href:"/games/trivia", external:false, badge:"Playable preview", ownershipAuthority:"play_point" },
  { sku:"shot_caddy.mode.classic", title:"Shot Caddy Classic", family:"Shot Caddy", description:"The core Shot Caddy disc-golf experience with challenge packs, tokens, Special Plays, and real-round scoring.", href:"https://shotcaddy.net/mode/classic", external:true, badge:"Shot Caddy", ownershipAuthority:"shot_caddy" },
  { sku:"shot_caddy.mode.battle", title:"Shot Caddy Battle", family:"Shot Caddy", description:"Competitive Shot Caddy play where challenges, tokens, Special Plays, and Battle Points turn the round into a head-to-head game.", href:"https://shotcaddy.net/mode/battle", external:true, badge:"Shot Caddy", ownershipAuthority:"shot_caddy" },
  { sku:"shot_caddy.mode.csp", title:"Challenge Skins Pro", family:"Shot Caddy", description:"A Shot Caddy mode built around challenge-driven skins play and competitive disc-golf decisions.", href:"https://shotcaddy.net/mode/csp", external:true, badge:"Shot Caddy", ownershipAuthority:"shot_caddy" },
] as const;

export const PLAY_POINT_GAME_SKUS = new Set(PLAY_POINT_GAME_CATALOG.map((game) => game.sku));
