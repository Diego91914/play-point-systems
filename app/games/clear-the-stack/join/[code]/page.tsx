import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { ClearStackJoinClient } from "./ClearStackJoinClient";
export default async function Page({params}:{params:Promise<{code:string}>}) {
 const {code}=await params;
 return <GameAtmosphere variant="library"><ClearStackJoinClient code={code}/></GameAtmosphere>;
}