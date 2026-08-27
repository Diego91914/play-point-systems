import type { Metadata } from "next";
import { HoldemPublicTable } from "./HoldemPublicTable";

export const metadata: Metadata = {
  title: "Hold'em Table View | Play Point Systems",
  description: "A spectator-safe shared table view for Play Point Hold'em rooms.",
  robots: { index: false, follow: false },
};

export default function HoldemTablePage() {
  return <HoldemPublicTable />;
}
