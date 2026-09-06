import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { SocialRoomController } from "@/app/games/_components/SocialRoomController";
import { AllAboutYouClient } from "./AllAboutYouClient";
import { GuestHonorPhoto } from "./GuestHonorPhoto";

export const metadata: Metadata = {
  title: "All About You | Birthday & Guest of Honor Game | Play Amplified",
  description: "Make the birthday person—or any Guest of Honor—the star while everyone predicts their answers, ranks favorites, and shares memories.",
  robots: { index: false, follow: false },
};

export default function AllAboutYouPage() {
  return (
    <SiteShell current="games">
      <GameAtmosphere variant="social">
        <RoomInviteSessionGuard storageKey="pps-all-about-you-session" roomApiBase="/api/games/all-about-you">
          <AllAboutYouClient />
          <GuestHonorPhoto />
          <SocialRoomController
            game="all-about-you"
            storageKey="pps-all-about-you-session"
            roomApiBase="/api/games/all-about-you"
          />
        </RoomInviteSessionGuard>
      </GameAtmosphere>
    </SiteShell>
  );
}
