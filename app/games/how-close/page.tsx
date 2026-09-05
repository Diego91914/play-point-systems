import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { RulesCorner } from "@/app/games/_components/RulesCorner";
import { SocialRoomController } from "@/app/games/_components/SocialRoomController";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { HowCloseClient } from "./HowCloseClient";
import { HowCloseMoment } from "./HowCloseMoment";

export const metadata:Metadata={title:"How Close Are We? | Play Point Systems",description:"A family table game where one Spotlight Player answers honestly and everyone else guesses their 1–100 answer.",robots:{index:false,follow:false}};
export default function Page(){return <SiteShell current="games"><GameAtmosphere variant="social"><RoomInviteSessionGuard storageKey="pps-how-close-session"><HowCloseClient/><HowCloseMoment/><RulesCorner game="how-close"/><SocialRoomController game="how-close" storageKey="pps-how-close-session" roomApiBase="/api/games/how-close"/></RoomInviteSessionGuard></GameAtmosphere></SiteShell>}
