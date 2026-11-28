import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { SocialRoomController } from "@/app/games/_components/SocialRoomController";
import { ThatsYourStoryClient } from "./ThatsYourStoryClient";
export const metadata: Metadata = {
  title: "That's Your Story? | Play Amplified",
  description:
    "Ridiculous situations. Questionable explanations. Let the crowd decide.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <SiteShell current="games">
      <GameAtmosphere variant="social">
        <RoomInviteSessionGuard
          credentialsInHeaders
          storageKey="pps-thats-your-story-session"
          roomApiBase="/api/games/thats-your-story"
        >
          <ThatsYourStoryClient />
          <SocialRoomController
            game="thats-your-story"
            storageKey="pps-thats-your-story-session"
            roomApiBase="/api/games/thats-your-story"
          />
        </RoomInviteSessionGuard>
      </GameAtmosphere>
    </SiteShell>
  );
}
