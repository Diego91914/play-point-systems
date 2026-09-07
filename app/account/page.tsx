import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { PlayAmplifiedAccountClient } from "./PlayAmplifiedAccountClient";

export const metadata: Metadata = {
  title: "Account | Play Amplified",
  description: "Sign in to your Play Amplified account.",
  robots: { index: false, follow: false, noarchive: true },
};

function safeReturnPath(value: string | undefined): string {
  if (!value || value.startsWith("//")) return "/games";
  if (
    value.startsWith("/games") ||
    value.startsWith("/play-amplified") ||
    value.startsWith("/shot-caddy")
  ) {
    return value;
  }
  return "/games";
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const destination = safeReturnPath(params.returnTo);
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(
    cookieStore.get(GAMES_SESSION_COOKIE)?.value,
  );

  // Builder/test sessions never enter customer account verification.
  // Existing Founder/member sessions likewise return directly to the app.
  if (claims) {
    redirect(destination);
  }

  return <PlayAmplifiedAccountClient returnTo={destination} />;
}
