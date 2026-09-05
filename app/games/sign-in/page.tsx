import type { Metadata } from "next";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { GamesSignInClient } from "./GamesSignInClient";

export const metadata: Metadata = {
  title: "Games Sign In | Play Point Systems",
  description: "Sign in to your Play Point Systems game library.",
  robots: { index: false, follow: false, noarchive: true },
};

function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/games") || value.startsWith("//")) {
    return "/games";
  }
  if (value.startsWith("/games/sign-in")) return "/games";
  return value;
}

export default async function GamesSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <SiteShell current="games">
      <GameAtmosphere variant="social">
        <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <GamesSignInClient nextPath={safeNextPath(params.next)} />
          </div>
        </section>
      </GameAtmosphere>
    </SiteShell>
  );
}
