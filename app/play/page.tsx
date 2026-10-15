import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";

export const metadata: Metadata = {
  title: "Play | Play Amplified",
  description: "Start, join, score, or return to your Play Amplified games.",
  alternates: { canonical: "/play" },
};

const actions = [
  {
    href: "/games#ready-to-play",
    eyebrow: "Pick up where you left off",
    title: "Continue Playing",
    body: "Open your library and jump straight back into a game you already have access to.",
    frame: "border-emerald-200/20 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_55%),rgba(52,211,153,0.055)]",
    accent: "text-emerald-100",
  },
  {
    href: "/play/host",
    eyebrow: "Bring the group together",
    title: "Host",
    body: "Create a shared room for a Play Amplified room game, then invite everyone by QR or code.",
    frame: "border-cyan-200/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_55%),rgba(34,211,238,0.055)]",
    accent: "text-cyan-100",
  },
  {
    href: "/play/join",
    eyebrow: "Someone already started",
    title: "Quick Join",
    body: "Enter the six-character room code. If you are with the host, scanning their QR is even faster.",
    frame: "border-fuchsia-200/20 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.13),transparent_55%),rgba(217,70,239,0.05)]",
    accent: "text-fuchsia-100",
  },
  {
    href: "/live/quick-score",
    eyebrow: "Just keep score",
    title: "Quick Score",
    body: "Track a round or match without loading a full game experience.",
    frame: "border-violet-200/20 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.13),transparent_55%),rgba(139,92,246,0.05)]",
    accent: "text-violet-100",
  },
  {
    href: "/games",
    eyebrow: "Everything you own",
    title: "My Games",
    body: "See your personal library, Founder access, and direct Play Now links in one place.",
    frame: "border-amber-200/20 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_55%),rgba(245,158,11,0.045)]",
    accent: "text-amber-100",
  },
] as const;

export default function PlayPage() {
  return (
    <SiteShell current="play">
      <section className="px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/58">Play Amplified</div>
            <h1 className="marketing-headline mt-4 leading-[0.98] lg:text-7xl">What do you want to do?</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
              This is the action screen. Discover games on Play Amplified, then come here when it is time to start, join, score, or get back into your library.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {actions.map((action, index) => (
              <Link
                key={action.title}
                href={action.href}
                className={`group rounded-[28px] border p-6 transition duration-200 hover:-translate-y-0.5 hover:border-white/30 ${action.frame} ${index === 0 ? "sm:col-span-2" : ""}`}
              >
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${action.accent}`}>{action.eyebrow}</div>
                <div className="mt-3 text-3xl font-black tracking-tight text-white">{action.title}</div>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">{action.body}</p>
                <div className={`mt-5 text-sm font-black ${action.accent}`}>Open →</div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Looking for something new?</div>
              <div className="mt-2 text-xl font-black text-white">Discovery belongs on the Play Amplified storefront.</div>
              <p className="mt-2 text-sm leading-6 text-white/52">Browse the full lineup, see the artwork, and learn how each experience plays before you start it.</p>
            </div>
            <Link href="/play-amplified" className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/16">Discover games →</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
