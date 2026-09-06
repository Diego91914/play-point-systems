import type { Metadata } from "next";
import { ProductShell } from "../../../components/ProductShell";
import { GameAtmosphere } from "../../_components/GameAtmosphere";
import { RulesCorner } from "../../_components/RulesCorner";
import { TriviaGameShowExperience } from "../play/TriviaGameShowExperience";
import { TriviaHostMoments } from "../play/TriviaHostMoments";

export const metadata: Metadata = {
  title: "Play Amplified Trivia",
  description: "Host a live Play Amplified trivia game with phones for every player.",
  robots: { index: false, follow: false },
};

export default function TriviaBuilderPage() {
  return (
    <GameAtmosphere variant="trivia">
      <ProductShell
        productName="Play Amplified Trivia"
        heading="Turn the table into a game show"
        summary="Choose the kind of trivia you want, get everyone into the room, and let the phones handle answers and scoring."
        status="Preview"
        backHref="/games/trivia"
        backLabel="Trivia overview"
        helpTitle="How it works"
        helpItems={[
          "One person hosts and controls the pace.",
          "Everyone else joins free on their own phone with the QR code or room code.",
          "Players answer privately while the host screen runs the question and reveal.",
          "Later rounds are worth more, and the game ends with a private final wager.",
          "When the winner is crowned, start another game with the same setup or choose something new.",
        ]}
      >
        <TriviaGameShowExperience />
        <TriviaHostMoments />
        <RulesCorner game="trivia" />
      </ProductShell>
    </GameAtmosphere>
  );
}
