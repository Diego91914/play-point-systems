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
      summary="Choose a difficulty, create the room, and share the join code with players."
      status="Preview"
      backHref="/games/trivia"
      backLabel="Trivia overview"
      helpTitle="Host guide"
      helpItems={[
        "The host creates the room and controls the pace.",
        "Players join on their phones with the room code or QR link.",
        "Questions use a 10-second, speed-based scoring clock.",
      ]}
    >
      <TriviaLiveBuilderExperience />
    </ProductShell>
  );
}
