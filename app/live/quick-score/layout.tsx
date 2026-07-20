import type { Metadata } from "next";
import QuickScorePwaRegistration from "./QuickScorePwaRegistration";

export const metadata: Metadata = {
  title: "Quick Score | Play Point Live",
  description: "A fast Play Point Live scoreboard for backyard games, clubs, and event nights.",
  manifest: "/live/quick-score/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quick Score",
  },
};

export default function QuickScoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <QuickScorePwaRegistration />
    </>
  );
}
