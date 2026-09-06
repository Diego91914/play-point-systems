import type { Metadata } from "next";
import { AllAboutYouClient } from "./AllAboutYouClient";

export const metadata: Metadata = {
  title: "All About You | Play Amplified",
  description: "A Guest of Honor party game where everyone tries to prove who knows the star of the night best.",
};

export default function AllAboutYouPage() {
  return <AllAboutYouClient />;
}
