import type { Metadata } from "next";
import { ProductShell } from "../../../components/ProductShell";
import { GameAtmosphere } from "../../_components/GameAtmosphere";
import { RulesCorner } from "../../_components/RulesCorner";
import { TriviaJoinExperience } from "./TriviaJoinExperience";

export const metadata: Metadata = {
  title: "Join Play Amplified Trivia",
  description: "Join a live Play Amplified trivia room from your phone.",
  robots: { index: false, follow: false },
};

export default function TriviaJoinPage() {
  return (
    <GameAtmosphere variant="trivia">
      <ProductShell
        productName="Play Amplified Trivia"
        heading="You’re in the game"
        summary="Enter the room code and your name. Your phone becomes your private answer pad."
        status="Preview"
        backHref="/games/trivia"
        backLabel="Trivia overview"
        helpTitle="Player guide"
        helpItems={[
          "Scan the host’s QR code or enter the six-character room code.",
          "Choose your player name and wait for the host to start.",
          "Questions appear for everyone together, but your answer stays on your phone.",
          "Lock an answer before time runs out, then watch the reveal and leaderboard move.",
          "The final question uses a private wager, so the game can change right at the end.",
        ]}
      >
        <TriviaJoinExperience />
        <RulesCorner game="trivia" />
      </ProductShell>
    </GameAtmosphere>
  );
}
