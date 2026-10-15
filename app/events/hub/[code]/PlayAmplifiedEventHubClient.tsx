"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Hub = {
  event: {
    id: string;
    name: string;
    event_date: string | null;
    status: string;
    join_code: string;
    registration_open: boolean;
  };
  teams: Array<{ id: string; name: string; participantIds: string[] }>;
  participants: Array<{ id: string; name: string; teamId: string | null }>;
  activities: Array<{
    id: string;
    module_id: string;
    name: string;
    sort_order: number;
    status: string;
    results: Array<{ entityType: string; entityId: string | null; placement: number; scoreLabel: string | null; eventPoints: number; source: string }>;
  }>;
  teamStandings: Array<{ id: string; name: string; points: number; wins: number; rank: number }>;
  individualStandings: Array<{ id: string; name: string; teamId: string | null; points: number; wins: number; rank: number }>;
  completedActivities: number;
  totalActivities: number;
};

function statusLabel(status: string) {
  if (status === "published") return "Registration open";
  if (status === "live") return "Live now";
  if (status === "complete") return "Final";
  return status;
}

export function PlayAmplifiedEventHubClient({ code }: { code: string }) {
  const [hub, setHub] = useState<Hub | null>(null);
  const [message, setMessage] = useState("Loading live standings…");

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch(`/api/events/hub/${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!active) return;
      if (!response.ok) {
        setMessage(data.error ?? "Event Hub unavailable.");
        return;
      }
      setHub(data.hub);
      setMessage("");
    }
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [code]);

  const participantById = useMemo(() => new Map((hub?.participants ?? []).map((participant) => [participant.id, participant])), [hub]);
  const teamById = useMemo(() => new Map((hub?.teams ?? []).map((team) => [team.id, team])), [hub]);

  if (!hub) {
    return <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center"><div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-8 text-white/60">{message}</div></main>;
  }

  const leader = hub.teamStandings[0];
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="overflow-hidden rounded-[32px] border border-cyan-200/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_38%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/55">Play Amplified Event Hub · {code}</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">{hub.event.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/55">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">{statusLabel(hub.event.status)}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">{hub.completedActivities}/{hub.totalActivities} challenges complete</span>
              {hub.event.event_date ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">{hub.event.event_date}</span> : null}
            </div>
          </div>
          {hub.event.registration_open ? <Link href={`/events/join/${code}`} className="self-start rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">JOIN EVENT</Link> : null}
        </div>
        {leader ? <div className="mt-8 rounded-[26px] border border-white/10 bg-black/25 p-5 sm:p-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Current leader</div><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div className="text-3xl font-black text-white">Team {leader.name}</div><div className="text-4xl font-black text-cyan-100">{leader.points} pts</div></div></div> : null}
      </header>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Overall championship</div><h2 className="mt-1 text-2xl font-black text-white">Team standings</h2></div><div className="text-xs font-bold text-white/35">Auto-refreshes</div></div>
          <div className="mt-5 space-y-2">
            {hub.teamStandings.length ? hub.teamStandings.map((team) => (
              <div key={team.id} className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border px-4 py-4 ${team.rank === 1 ? "border-cyan-200/25 bg-cyan-300/[0.07]" : "border-white/10 bg-black/20"}`}>
                <div className="text-center text-lg font-black text-white/45">#{team.rank}</div>
                <div><div className="font-black text-white">Team {team.name}</div><div className="text-xs font-bold text-white/35">{team.wins} challenge win{team.wins === 1 ? "" : "s"}</div></div>
                <div className="text-2xl font-black text-cyan-100">{team.points}</div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">Standings appear as soon as the first challenge is scored.</div>}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Individual achievements</div><h2 className="mt-1 text-2xl font-black text-white">Individual leaders</h2>
          <div className="mt-5 space-y-2">
            {hub.individualStandings.length ? hub.individualStandings.slice(0, 10).map((player) => (
              <div key={player.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div><div className="font-black text-white">#{player.rank} {player.name}</div><div className="text-xs font-bold text-white/35">{player.teamId ? `Team ${teamById.get(player.teamId)?.name ?? ""}` : "Individual"} · {player.wins} win{player.wins === 1 ? "" : "s"}</div></div>
                <div className="text-xl font-black text-white">{player.points}</div>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">Individual points appear when a challenge awards participant results.</div>}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Run of play</div><h2 className="mt-1 text-2xl font-black text-white">Challenge board</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {hub.activities.map((activity) => (
            <article key={activity.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/30">Challenge {activity.sort_order}</div><div className="mt-1 text-lg font-black text-white">{activity.name}</div></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${activity.status === "complete" ? "bg-emerald-300/10 text-emerald-100" : "bg-white/[0.06] text-white/40"}`}>{activity.status}</span></div>
              {activity.results.length ? <div className="mt-4 space-y-1.5">{[...activity.results].sort((a,b) => a.placement - b.placement).slice(0,3).map((result) => {
                const label = result.entityType === "team" ? `Team ${teamById.get(result.entityId ?? "")?.name ?? ""}` : participantById.get(result.entityId ?? "")?.name ?? "Participant";
                return <div key={`${result.entityType}-${result.entityId}`} className="flex items-center justify-between text-sm"><span className="font-bold text-white/65">#{result.placement} {label}</span><span className="font-black text-cyan-100">+{result.eventPoints}</span></div>;
              })}</div> : <div className="mt-4 text-sm text-white/30">Awaiting results.</div>}
            </article>
          ))}
        </div>
      </section>

      {hub.event.status === "complete" && leader ? <section className="mt-5 rounded-[28px] border border-amber-200/20 bg-amber-300/[0.06] p-6 text-center"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/55">Event champion</div><div className="mt-2 text-4xl font-black text-amber-50">Team {leader.name}</div><div className="mt-2 text-sm font-bold text-amber-50/60">{leader.points} total event points</div></section> : null}
    </main>
  );
}
