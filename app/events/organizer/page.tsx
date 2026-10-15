import { cookies } from "next/headers";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { PlayAmplifiedEventOrganizerClient } from "./PlayAmplifiedEventOrganizerClient";

export default async function PlayAmplifiedEventOrganizerPage() {
  const store = await cookies();
  const claims = await verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);

  return (
    <SiteShell current="games">
      <GameAtmosphere variant="library">
        <PlayAmplifiedEventOrganizerClient signedIn={Boolean(claims)} />
      </GameAtmosphere>
    </SiteShell>
  );
}
