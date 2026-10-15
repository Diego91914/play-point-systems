import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { getSafeGamesReturnPath } from "@/lib/play-point-core/safe-games-return-path";
import { PlayAmplifiedAccountClient } from "./PlayAmplifiedAccountClient";

export const metadata: Metadata = {
  title: "Account | Play Amplified",
  description: "Sign in to your Play Amplified account.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const destination = getSafeGamesReturnPath(params.returnTo, "/games");
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(
    cookieStore.get(GAMES_SESSION_COOKIE)?.value,
  );

  if (claims) {
    redirect(destination);
  }

  return <PlayAmplifiedAccountClient returnTo={destination} />;
}
