import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { getSafeGamesReturnPath } from "@/lib/play-point-core/safe-games-return-path";
import { BuilderAccessClient } from "./BuilderAccessClient";

export const metadata: Metadata = {
  title: "Builder Access | Play Amplified",
  description: "Private Play Amplified builder and Founder test access.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function BuilderAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const destination = getSafeGamesReturnPath(params.next, "/games");
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(
    cookieStore.get(GAMES_SESSION_COOKIE)?.value,
  );

  if (claims?.role === "builder" || claims?.role === "founder") {
    redirect(destination);
  }

  return <BuilderAccessClient nextPath={destination} />;
}
