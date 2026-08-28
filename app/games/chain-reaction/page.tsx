import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RulesCorner } from "@/app/games/_components/RulesCorner";
import { ChainReactionClient } from "./ChainReactionClient";

export const metadata:Metadata={title:"Chain Reaction | Play Point Systems",description:"A fast family word-linking game built for the table.",robots:{index:false,follow:false}};
export default function Page(){ return <SiteShell current="games"><ChainReactionClient/><RulesCorner game="chain-reaction"/></SiteShell>; }
