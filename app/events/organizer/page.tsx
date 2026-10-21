import Link from "next/link";
import { cookies } from "next/headers";
import { SiteShell } from "@/app/components/SiteShell";
import { GameAtmosphere } from "@/app/games/_components/GameAtmosphere";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { PlayAmplifiedEventOrganizerClient } from "./PlayAmplifiedEventOrganizerClient";

export default async function PlayAmplifiedEventOrganizerPage() {
  const store = await cookies();
  const claims = await verifyGamesSessionToken(store.get(GAMES_SESSION_COOKIE)?.value);
  let controlEvents: Array<{ id: string; name: string; status: string; join_code: string | null }> = [];

  if (claims) {
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase
        .from("ppl_amplified_events")
        .select("id,name,status,join_code")
        .eq("owner_user_id", claims.sub)
        .in("status", ["live", "complete"])
        .order("created_at", { ascending: false })
        .limit(6);
      controlEvents = data ?? [];
    } catch {
      // The Events migrations are intentionally not executed by the draft PR stack.
      // Keep the organizer shell usable while the schema is still awaiting approval.
    }
  }

  return (
    <SiteShell current="games">
      <GameAtmosphere variant="library">
        {controlEvents.length ? (
          <section className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6">
            <div className="rounded-[24px] border border-emerald-200/15 bg-emerald-300/[0.045] p-4 sm:p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100/55">Event control centers</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {controlEvents.map((event) => (
                  <div key={event.id} className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-xs font-black text-white/70">{event.name} · {event.status}</span>
                    <Link href={`/events/organizer/${event.id}/score`} className="text-xs font-black text-emerald-100">SCORE</Link>
                    {event.join_code ? <Link href={`/events/hub/${event.join_code}`} className="text-xs font-black text-cyan-100">HUB</Link> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        <PlayAmplifiedEventOrganizerClient signedIn={Boolean(claims)} />
      </GameAtmosphere>
    </SiteShell>
  );
}
