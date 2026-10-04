import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { ClearTheStackClient } from "./ClearTheStackClient";

export const metadata: Metadata = {
  title: "Clear the Stack | Play Amplified",
  description: "A solo or multiplayer backyard putting game. Pick a distance and stack size, then clear every disc in three rounds.",
  robots: { index: false, follow: false },
};

export default function ClearTheStackPage() {
  return <SiteShell current="games"><GameAtmosphere variant="library"><ClearTheStackClient /></GameAtmosphere></SiteShell>;
}
