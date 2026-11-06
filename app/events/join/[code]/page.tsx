import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { EventJoinClient } from "./EventJoinClient";

export default async function PlayAmplifiedEventJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <SiteShell current="games">
      <GameAtmosphere variant="library">
        <EventJoinClient code={code.toUpperCase()} />
      </GameAtmosphere>
    </SiteShell>
  );
}
