import { SiteShell } from "@/app/components/SiteShell";
import { GuestJoinGameClient } from "./GuestJoinGameClient";

export const metadata = {
  title: "Join a Game | Play Amplified",
  description: "Join a Play Amplified room as a guest.",
  robots: { index: false, follow: false, noarchive: true },
};

const CODE_PATTERN = /^[A-Z2-9]{6}$/;

export default async function JoinGamePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[]; lookup?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawCode = Array.isArray(params.code) ? params.code[0] ?? "" : params.code ?? "";
  const initialCode = rawCode.trim().toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
  const rawLookup = Array.isArray(params.lookup) ? params.lookup[0] : params.lookup;

  return (
    <SiteShell current="play" variant="play-amplified">
      <GuestJoinGameClient initialCode={initialCode} autoLookup={rawLookup === "1" && CODE_PATTERN.test(initialCode)} />
    </SiteShell>
  );
}

