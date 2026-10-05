import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";
import { PLAY_POINT_GAME_CATALOG } from "@/lib/play-point-core/games-catalog";

export const metadata = {
  title: "Host a Game | Play Amplified",
  description: "Choose a Play Amplified game and create a room for your group.",
};

export default function HostGamePage() {
  const games = PLAY_POINT_GAME_CATALOG.filter((game) => game.status === "live");
  return (
    <SiteShell current="play">
      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/play" className="text-sm font-bold text-white/50 hover:text-white">← Back to Play</Link>
          <div className="mt-7 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/60">Host a game</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">What are we playing?</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">Pick the experience. Play Amplified will take you into that game&apos;s setup, then your players can join by QR code or room code.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link key={game.sku} href={game.href} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-white/[0.055]">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/50">{game.family}</div>
                <div className="mt-2 text-xl font-black text-white">{game.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/52">{game.shortDescription}</p>
                <div className="mt-4 text-sm font-black text-cyan-100">Host →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
