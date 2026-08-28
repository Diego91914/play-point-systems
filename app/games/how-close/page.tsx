import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { HowCloseClient } from "./HowCloseClient";

export const metadata:Metadata={title:"How Close Are We? | Play Point Systems",description:"A family table game where everyone privately rates the same question from 1 to 100.",robots:{index:false,follow:false}};
export default function Page(){return <SiteShell current="games"><RoomInviteSessionGuard storageKey="pps-how-close-session"><HowCloseClient/></RoomInviteSessionGuard></SiteShell>}
