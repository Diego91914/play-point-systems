import type { Metadata } from "next";
import { ProductShell } from "../../../components/ProductShell";
import { TriviaJoinExperience } from "./TriviaJoinExperience";

export const metadata: Metadata = {
  title: "Join Play Point Trivia",
  description: "Sign into a live Bible trivia room from your phone on Play Point Systems.",
  robots: { index: false, follow: false },
};

export default function TriviaJoinPage() {
  return (
    <ProductShell
      productName="Play Point Trivia"
      heading="Join a trivia room"
      summary="Enter the host's room code and your player name to start."
      status="Preview"
      backHref="/games/trivia"
      backLabel="Trivia overview"
      helpTitle="How joining works"
      helpItems={[
        "Scan the host's QR code or enter the six-character room code.",
        "Add your player name and wait for the host to begin.",
        "Answer each question before the host-selected clock expires.",
      ]}
    >
      <TriviaJoinExperience />
    </ProductShell>
  );
}
