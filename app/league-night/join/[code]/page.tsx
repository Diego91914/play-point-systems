import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { LeagueJoinClient } from "./LeagueJoinClient";

export default async function LeagueJoinPage({ params }: { params: Promise<{ code:string }> }) {
  const { code } = await params;
  return <SiteShell current="games"><GameAtmosphere variant="library"><LeagueJoinClient code={code} /></GameAtmosphere></SiteShell>;
}
