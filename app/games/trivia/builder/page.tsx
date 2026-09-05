import type { Metadata } from "next";
import { ProductShell } from "../../../components/ProductShell";
import { GameAtmosphere } from "../../_components/GameAtmosphere";
import { RulesCorner } from "../../_components/RulesCorner";
import { TriviaLiveBuilderExperience } from "../play/TriviaLiveBuilderExperience";
import { TriviaHostMoments } from "../play/TriviaHostMoments";

export const metadata: Metadata = {
  title: "Play Point Trivia Builder",
  description: "Host and run a live trivia room from published categories and topics on Play Point Systems.",
  robots: { index: false, follow: false },
};

export default function TriviaBuilderPage() {
  return (
    <GameAtmosphere variant="trivia">
      <ProductShell
        productName="Trivia Host"
        heading="Create a live trivia room"
        summary="Choose a category, topics, difficulty, and pace, then share the join code with players."
        status="Preview"
        backHref="/games/trivia"
        backLabel="Trivia overview"
        helpTitle="Host guide"
        helpItems={[
          "The host creates the room and controls the pace.",
          "Players join on their phones with the room code or QR link.",
          "Choose Standard 10-second pacing or Relaxed 20-second pacing before creating the room.",
          "Scoring rises from a fixed 500-point warm-up to 3,000-point Final Word questions.",
          "Open Projector Mode after creating the room for a full-screen presentation view.",
        ]}
      >
        <TriviaLiveBuilderExperience />
        <TriviaHostMoments />
        <RulesCorner game="trivia" />
      </ProductShell>
    </GameAtmosphere>
  );
}
