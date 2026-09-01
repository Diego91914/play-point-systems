import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { MysteryClient } from "./MysteryClient";
import { MysteryHostControls } from "./MysteryHostControls";
import { MysteryCaseIntelligence } from "./MysteryCaseIntelligence";

export const metadata: Metadata = {
  title: "Last Call | Play Amplified",
  description: "A phone-guided face-to-face murder mystery where every player has private memories, evidence, and motives.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <SiteShell current="games">
      <RoomInviteSessionGuard storageKey="pps-mystery-session">
        <MysteryClient />
        <MysteryCaseIntelligence />
        <MysteryHostControls />
      </RoomInviteSessionGuard>
    </SiteShell>
  );
}
