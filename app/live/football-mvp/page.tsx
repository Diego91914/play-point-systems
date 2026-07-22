import type { Metadata } from "next";
import { ProductShell } from "@/app/components/ProductShell";
import { FootballMvpHostExperience } from "./FootballMvpHostExperience";

export const metadata: Metadata = {
  title: "Play Point Live Venue Control",
  description: "Internal venue-side demo for programming rewards, posting scores, and handling corrections.",
  robots: { index: false, follow: false },
};

export default function PlayPointLiveFootballMvpPage() {
  return (
    <ProductShell
      productName="Venue Control"
      heading="Run tonight's football reward board"
      summary="Program rewards, post scores, and manage the live room from one control surface."
      status="Internal demo"
      backHref="/live"
      backLabel="Live overview"
      helpTitle="Staff guide"
      helpItems={[
        "Program the hidden reward squares before guests begin.",
        "Post each quarter score to move the live square.",
        "The third-quarter update reveals rewards; corrections remain available for a wrong final.",
      ]}
    >
      <FootballMvpHostExperience />
    </ProductShell>
  );
}
