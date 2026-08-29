import type { Metadata } from "next";
import { SiteShell } from "../../components/SiteShell";
import { RulesCorner } from "@/app/games/_components/RulesCorner";
import { SocialRoomController } from "@/app/games/_components/SocialRoomController";
import { HoldemClient } from "./HoldemClient";
import { HoldemHostStartControl } from "./HoldemHostStartControl";
import { HoldemPreAction } from "./HoldemPreAction";

export const metadata: Metadata = {
  title: "Phone Hold'em",
  description: "A private Texas Hold'em table where every player uses their own phone and the software handles the deck, chips, action, and showdown.",
  alternates: { canonical: "/games/holdem" },
};

export default function HoldemPage() {
  return (
    <SiteShell current="games">
      <HoldemClient />
      <HoldemHostStartControl />
      <HoldemPreAction />
      <RulesCorner game="holdem" />
      <SocialRoomController game="holdem" storageKeyPrefix="pps-holdem-" roomApiBase="/api/games/holdem" />
    </SiteShell>
  );
}
