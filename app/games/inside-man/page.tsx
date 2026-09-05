import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { RulesCorner } from "@/app/games/_components/RulesCorner";
import { SocialRoomController } from "@/app/games/_components/SocialRoomController";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { InsideManClient } from "./InsideManClient";

export const metadata:Metadata={title:"The Inside Man | Play Point Systems",description:"A phone-powered social deduction game where one player secretly sabotages the group's missions.",robots:{index:false,follow:false}};
export default function Page(){return <SiteShell current="games"><GameAtmosphere variant="deduction"><RoomInviteSessionGuard storageKey="pps-inside-man-session"><InsideManClient/><RulesCorner game="inside-man"/><SocialRoomController game="inside-man" storageKey="pps-inside-man-session" roomApiBase="/api/games/inside-man"/></RoomInviteSessionGuard></GameAtmosphere></SiteShell>}
