import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { GetThereClient } from "./GetThereClient";

export const metadata:Metadata={title:"GET THERE | Play Point Systems",description:"A face-to-face family conversation game: follow the answers, hide the destination, and see who can get there fastest.",robots:{index:false,follow:false}};
export default function Page(){return <SiteShell current="games"><GetThereClient/></SiteShell>}
