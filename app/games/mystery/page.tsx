import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { BlackwoodAtmosphere } from "./BlackwoodAtmosphere";
import { MysteryClient } from "./MysteryClient";
import { MysteryHostControls } from "./MysteryHostControls";
import { MysteryCaseIntelligence } from "./MysteryCaseIntelligence";
import { MysteryCaseLayer } from "./MysteryCaseLayer";
import { MysteryDormantEvidence } from "./MysteryDormantEvidence";
import { MysteryTurnGuide } from "./MysteryTurnGuide";
import { MysteryCastPortraits } from "./MysteryCastPortraits";
import { MysteryPortraitChoices } from "./MysteryPortraitChoices";
import { MysteryRevealPortrait } from "./MysteryRevealPortrait";
import { MysteryEvidenceArt } from "./MysteryEvidenceArt";
import styles from "./mystery-theme.module.css";

export const metadata: Metadata = {
  title: "Last Call | Play Amplified",
  description: "A phone-guided face-to-face murder mystery where every player follows a private investigative path and must build a case strong enough to convict.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <SiteShell current="games">
      <div className={styles.theme}>
        <BlackwoodAtmosphere />
        <RoomInviteSessionGuard storageKey="pps-mystery-session">
          <MysteryClient />
          <MysteryTurnGuide />
          <MysteryCastPortraits />
          <MysteryPortraitChoices />
          <MysteryRevealPortrait />
          <MysteryEvidenceArt />
          <MysteryCaseIntelligence />
          <MysteryCaseLayer />
          <MysteryDormantEvidence />
          <MysteryHostControls />
        </RoomInviteSessionGuard>
      </div>
    </SiteShell>
  );
}
