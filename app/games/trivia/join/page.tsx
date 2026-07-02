import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../../../components/SiteShell";
import { TriviaJoinExperience } from "./TriviaJoinExperience";

export const metadata: Metadata = {
  title: "Join Play Point Trivia",
  description: "Sign into a live Bible trivia room from your phone on Play Point Systems.",
};

export default function TriviaJoinPage() {
  return (
    <SiteShell current="games">
      <section className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-16 xl:pb-24 xl:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-end xl:gap-14">
          <div className="max-w-4xl reveal-up">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Player Join
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5rem] xl:leading-[0.96]">
              Sign into the trivia room from your phone.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-100/88 sm:text-xl sm:leading-8">
              Enter the room code from the Bible trivia builder, add your name, and answer live on playpointsystems.com.
            </p>
            <div className="mt-7 flex flex-col gap-3 xs:flex-row sm:flex-row">
              <Link href="/games/trivia/builder" className="inline-flex items-center justify-center rounded-2xl border border-cyan-200/35 bg-[linear-gradient(120deg,rgba(118,225,255,0.36),rgba(120,170,255,0.2))] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(92,180,255,0.24)] transition hover:brightness-110">
                Open Builder
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,182,255,0.12),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">Join steps</div>
            <ul className="mt-5 grid gap-3 text-sm text-white/78">
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" /><span>Scan the QR code or type the room code.</span></li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" /><span>Add your player name.</span></li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" /><span>The first public MVP is Bible trivia using Gold-reviewed vault content.</span></li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" /><span>Wait for the host to start the game.</span></li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" /><span>Each question starts at 1,000 points on a 10-second clock and drops by 100 every second.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <TriviaJoinExperience />
    </SiteShell>
  );
}
