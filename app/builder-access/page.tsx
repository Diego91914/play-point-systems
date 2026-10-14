import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";
import { BuilderAccessClient } from "./BuilderAccessClient";

export const metadata: Metadata = {
  title: "Builder Access | Play Amplified",
  description: "Private Play Amplified builder and Founder test access.",
  robots: { index: false, follow: false, noarchive: true },
};

function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\\u0000-\\u001f]/.test(value)) return "/games";
  const pathname = value.split(/[?#]/, 1)[0];
  const allowed = ["/games", "/play", "/play-amplified", "/shot-caddy"];
  if (!allowed.some((root) => pathname === root || pathname.startsWith(`${root}/`))) return "/games";
  return value;
}

export default async function BuilderAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const destination = safeNextPath(params.next);
  const cookieStore = await cookies();
  const claims = await verifyGamesSessionToken(
    cookieStore.get(GAMES_SESSION_COOKIE)?.value,
  );

  if (claims?.role === "builder" || claims?.role === "founder") {
    redirect(destination);
  }

  return <BuilderAccessClient nextPath={destination} />;
}
