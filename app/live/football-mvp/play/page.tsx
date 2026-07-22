import type { Metadata } from "next";
import { ProductShell } from "@/app/components/ProductShell";
import { FootballMvpPlayerExperience } from "./FootballMvpPlayerExperience";

export const metadata: Metadata = {
  title: "Play Point Live Game Night Player",
  description: "Player-facing internal game-night demo for football picks and venue rewards.",
  robots: { index: false, follow: false },
};

export default function PlayPointLiveFootballMvpPlayerPage() {
  return (
    <ProductShell
      productName="Game Night Player"
      heading="Make your three picks"
      summary="Choose a player ID, save your picks, and follow the live reward board."
      status="Internal demo"
      backHref="/live"
      backLabel="Live overview"
      helpTitle="Player guide"
      helpItems={[
        "Choose the winner, predict the final score, and select square digits.",
        "Your picks lock to this game when you save them.",
        "Stay through the third quarter to see the venue reward reveal.",
      ]}
    >
      <FootballMvpPlayerExperience />
    </ProductShell>
  );
}
