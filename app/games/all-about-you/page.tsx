import type { Metadata } from "next";
import { AllAboutYouClient } from "./AllAboutYouClient";

export const metadata: Metadata = {
  title: "All About You | Birthday & Guest of Honor Game | Play Amplified",
  description: "Make the birthday person—or any Guest of Honor—the star while everyone predicts their answers, ranks favorites, and shares memories.",
};

export default function AllAboutYouPage() {
  return <AllAboutYouClient />;
}
