import Link from "next/link";
import {
  PLAY_AMPLIFIED_EVENT_FOUNDATION,
  PLAY_AMPLIFIED_EVENT_TEMPLATES,
  SHOT_CADDY_EVENT_KIT,
} from "@/lib/play-point-core/play-amplified-events";

const sampleStandings = [
  { team: "Crimson", points: 42, note: "2 event wins" },
  { team: "Gold", points: 38, note: "1 event win" },
  { team: "Blue", points: 35, note: "1 event win" },
] as const;

const sampleSchedule = [
  { label: "Team CSP", state: "Complete" },
  { label: "Company Trivia", state: "Live" },
  { label: "Clear the Stack", state: "Up next" },
  { label: "Final Team Challenge", state: "Later" },
] as const;

export default function PlayAmplifiedEventsPage() {
  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_80%_25%,rgba(168,85,247,0.13),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-4xl">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Play Amplified Events</div>
            <h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Don&apos;t just host an outing.
              <span className="block text-cyan-100">Give everyone something to play for.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              Play Amplified Events turns company outings, tournaments, fundraisers, and community gatherings into organized interactive experiences with one join point, shared teams, live standings, and multiple ways to compete.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                Plan an event
              </Link>
              <a href="#event-kits" className="rounded-full border border-white/20 bg-white/[0.05] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                Explore event kits
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["One QR", "One registration point for the event"],
              ["Balanced teams", "Build competition across skill levels"],
              ["Live standings", "Individual and team results in one place"],
              ["One champion", "Every activity can feed the event score"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
                <div className="text-lg font-black tracking-tight">{title}</div>
                <div className="mt-1 text-sm leading-6 text-white/50">{description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200/65">The Event Hub</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">One control center for the whole day.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/58 sm:text-base">
              The event is the product. Individual games become stations, challenges, or rounds inside a larger shared competition. Organizers manage teams and the schedule while players see what is live, what comes next, and where their team stands.
            </p>
            <p className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.055] p-4 text-sm font-bold leading-6 text-cyan-50/80">
              {PLAY_AMPLIFIED_EVENT_FOUNDATION.promise}
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.025] shadow-2xl shadow-black/30">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/50">Event Hub concept preview</div>
              <div className="mt-1 text-xl font-black">Corporate Team Challenge</div>
              <div className="mt-1 text-xs font-bold text-white/40">Sample event · 3 teams · 4 activities</div>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Live standings</div>
                <div className="mt-4 space-y-3">
                  {sampleStandings.map((row, index) => (
                    <div key={row.team} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-xs font-black">{index + 1}</div>
                        <div>
                          <div className="font-black">Team {row.team}</div>
                          <div className="text-[11px] font-bold text-white/35">{row.note}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-black tabular-nums text-cyan-100">{row.points}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Today&apos;s run of play</div>
                <div className="mt-4 space-y-3">
                  {sampleSchedule.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 border-b border-white/8 pb-3 last:border-0 last:pb-0">
                      <span className="text-sm font-black">{item.label}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${item.state === "Live" ? "border-emerald-200/25 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                        {item.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="event-kits" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/55">Event kits</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Start with a proven format. Build from there.</h2>
            <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
              Play Amplified Events can support focused single-sport packages or a broader multi-game corporate challenge. The organizer buys the experience, not a pile of disconnected games.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PLAY_AMPLIFIED_EVENT_TEMPLATES.map((template) => (
              <article key={template.id} className="flex h-full flex-col rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.025] p-5">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/50">{template.eyebrow}</div>
                <h3 className="mt-2 text-2xl font-black tracking-tight">{template.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/55">{template.description}</p>
                <div className="mt-auto pt-5 text-xs font-bold leading-5 text-white/38">{template.idealFor}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="overflow-hidden rounded-[30px] border border-emerald-200/15 bg-[radial-gradient(circle_at_75%_20%,rgba(52,211,153,0.14),transparent_30%),linear-gradient(to_bottom_right,rgba(6,78,59,0.38),rgba(2,6,23,0.94))] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100/60">Flagship package</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Shot Caddy Event Kit</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                Preserve the original corporate disc golf concept as a signature package inside Play Amplified Events. Teams compete through the round while individual skill championships create something meaningful to chase on every type of hole.
              </p>
              <div className="mt-5 inline-flex rounded-full border border-emerald-200/20 bg-emerald-300/[0.08] px-3 py-1.5 text-xs font-black text-emerald-100">
                {SHOT_CADDY_EVENT_KIT.recommendedGroup}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Hole-by-hole championship</div>
              <div className="mt-4 divide-y divide-white/8">
                {SHOT_CADDY_EVENT_KIT.championships.map((row) => (
                  <div key={row.hole} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="text-sm font-black text-white/55">{row.hole}</span>
                    <span className="text-sm font-black text-white">{row.competition}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-100/55">The expansion path</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Bigger than disc golf.</h2>
            <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
              Shot Caddy remains the flagship sports package, but the event layer can orchestrate multiple Play Amplified experiences without changing what makes each game work.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLAY_AMPLIFIED_EVENT_FOUNDATION.capabilities.map((capability) => (
              <div key={capability} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/80">
                {capability}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-cyan-300 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Play Point Systems · Play Amplified Events</div>
            <div className="mt-2 text-2xl font-black tracking-tight">Build the outing people keep talking about.</div>
          </div>
          <Link href="/contact" className="self-start rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white md:self-auto">
            Plan an event
          </Link>
        </div>
      </section>
    </main>
  );
}
