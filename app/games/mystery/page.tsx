import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { MysteryClient } from "./MysteryClient";
import { MysteryHostControls } from "./MysteryHostControls";
import { MysteryCaseIntelligence } from "./MysteryCaseIntelligence";
import { MysteryCaseLayer } from "./MysteryCaseLayer";
import { MysteryDormantEvidence } from "./MysteryDormantEvidence";
import { MysteryTurnGuide } from "./MysteryTurnGuide";

export const metadata: Metadata = {
  title: "Last Call | Play Amplified",
  description: "A phone-guided face-to-face murder mystery where every player follows a private investigative path and must build a case strong enough to convict.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <SiteShell current="games">
      <RoomInviteSessionGuard storageKey="pps-mystery-session">
        <MysteryClient />
        <MysteryTurnGuide />
        <MysteryCaseIntelligence />
        <MysteryCaseLayer />
        <MysteryDormantEvidence />
        <MysteryHostControls />
      </RoomInviteSessionGuard>
    </SiteShell>
  );
}
