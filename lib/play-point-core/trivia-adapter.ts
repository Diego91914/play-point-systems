import type { PlayPointCapabilityId } from "./contracts";

export interface PlayPointProductAdapter {
  product: string;
  currentHome: string;
  strengths: readonly string[];
  mappedCapabilities: readonly PlayPointCapabilityId[];
  notes: readonly string[];
}

export const TRIVIA_CORE_ADAPTER: PlayPointProductAdapter = {
  product: "Play Point Trivia",
  currentHome: "Play Point Systems",
  strengths: [
    "Hosted live room creation",
    "QR and room-code joining",
    "Shared session scoreboard",
    "Host display flow",
  ],
  mappedCapabilities: ["events", "contests", "leaderboards", "qr-joining", "tv-mode"],
  notes: [
    "Trivia is already proving the hosted-room pattern inside Play Point Systems.",
    "Its session lifecycle can become the first direct consumer of Play Point Core event contracts.",
  ],
};

export const SHOT_CADDY_LIVE_BRIDGE: PlayPointProductAdapter = {
  product: "Legacy Play Point Live Boards",
  currentHome: "Shot Caddy bridge runtime",
  strengths: [
    "Venue board creation",
    "Public board and venue hubs",
    "TV mode board rendering",
    "Play Point Live naming already in the wild",
  ],
  mappedCapabilities: ["events", "contests", "leaderboards", "achievements", "play-points", "qr-joining", "tv-mode"],
  notes: [
    "Keep this runtime operational during migration so existing previews do not break.",
    "Treat it as a bridge, not the long-term product home.",
  ],
};
