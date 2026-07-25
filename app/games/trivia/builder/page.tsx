import type { Metadata } from "next";
import { ProductShell } from "../../../components/ProductShell";
import { TriviaLiveBuilderExperience } from "../play/TriviaLiveBuilderExperience";

export const metadata: Metadata = {
  title: "Play Point Bible Trivia Builder",
  description: "Host and run a live Bible trivia room on Play Point Systems.",
  robots: { index: false, follow: false },
};

export default function TriviaBuilderPage() {
  return (
    <ProductShell
      productName="Trivia Host"
      heading="Create a live Bible trivia room"
      summary="Choose a difficulty and pace, create the room, and share the join code with players."
      status="Preview"
      backHref="/games/trivia"
      backLabel="Trivia overview"
      helpTitle="Host guide"
      helpItems={[
        "The host creates the room and controls the pace.",
        "Players join on their phones with the room code or QR link.",
        "Choose Standard 10-second pacing or Relaxed 20-second pacing before creating the room.",
        "Open Projector Mode after creating the room for a full-screen presentation view.",
      ]}
    >
      <TriviaLiveBuilderExperience />
    </ProductShell>
  );
}
