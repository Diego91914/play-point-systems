import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { RoomInviteSessionGuard } from "@/app/games/_components/RoomInviteSessionGuard";
import { OnMyListClient } from "./OnMyListClient";
export const metadata:Metadata={title:"On My List | Play Point Systems",description:"A family table game where one person builds a private ranked answer board and everyone else tries to uncover it before two misses knock them out.",robots:{index:false,follow:false}};
export default function Page(){return <SiteShell current="games"><RoomInviteSessionGuard storageKey="pps-on-my-list-session"><OnMyListClient/></RoomInviteSessionGuard></SiteShell>}
