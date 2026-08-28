import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { RulesCorner } from "@/app/games/_components/RulesCorner";
import { SocialRoomController } from "@/app/games/_components/SocialRoomController";
import { ChainReactionClient } from "./ChainReactionClient";

export const metadata:Metadata={title:"Chain Reaction | Play Point Systems",description:"A fast family word-linking game built for the table.",robots:{index:false,follow:false}};
export default function Page(){ return <SiteShell current="games"><RoomInviteSessionGuard storageKey="pps-chain-reaction-session"><ChainReactionClient/><RulesCorner game="chain-reaction"/><SocialRoomController game="chain-reaction" storageKey="pps-chain-reaction-session" roomApiBase="/api/games/chain-reaction"/></RoomInviteSessionGuard></SiteShell>; }
