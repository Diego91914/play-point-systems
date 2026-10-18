"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  pointsForPlacement,
  recommendedResultSourceForModule,
} from "@/lib/play-point-core/play-amplified-event-scoring";
import type { PlayAmplifiedEventModuleId } from "@/lib/play-point-core/play-amplified-events";

type EventData = {
  id: string;
  name: string;
  status: string;
  join_code: string | null;
  participants: Array<{ id: string; name: string; skill: number; checkedIn: boolean }>;
  teams: Array<{ id: string; name: string; participantIds: string[] }>;
  activities: Array<{ id: string; module_id: PlayAmplifiedEventModuleId; name: string; sort_order: number; status: string }>;
  teamStandings: Array<{ id: string; name: string; points: number; wins: number; rank: number }>;
  individualStandings: Array<{ id: string; name: string; teamId: string | null; points: number; wins: number; rank: number }>;
  completedActivities: number;
};

function defaultEntityType(moduleId: PlayAmplifiedEventModuleId): "team" | "participant" {
  if (moduleId === "team-csp" || moduleId === "company-trivia" || moduleId === "social-game" || moduleId === "custom-challenge") return "team";
  return "participant";
}

export function PlayAmplifiedEventScoringClient({ eventId, signedIn }: { eventId: string; signedIn: boolean }) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [entityType, setEntityType] = useState<"team" | "participant">("team");
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [scoreLabels, setScoreLabels] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Loading event control center…");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    void fetch(`/api/events/${encodeURIComponent(eventId)}/results`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
      .then(({ response, data }) => {
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setMessage(data.error ?? "Could not load event scoring.");
          return;
        }
        setEvent(data.event);
        const activities = data.event.activities as EventData["activities"];
        const next = activities.find((activity) => activity.status !== "complete") ?? activities[0];
        if (next) {
          setSelectedActivityId((current) => current || next.id);
          setEntityType(defaultEntityType(next.module_id));
        }
        setMessage("");
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [eventId, signedIn]);

  const selectedActivity = useMemo(() => event?.activities.find((activity) => activity.id === selectedActivityId) ?? null, [event, selectedActivityId]);
  const scoringRows = entityType === "team" ? event?.teams ?? [] : event?.participants ?? [];
  const totalActivities = event?.activities.length ?? 0;
  const allComplete = Boolean(event && totalActivities > 0 && event.completedActivities === totalActivities);

  function chooseActivity(activityId: string) {
    const activity = event?.activities.find((item) => item.id === activityId);
    setSelectedActivityId(activityId);
    if (activity) setEntityType(defaultEntityType(activity.module_id));
    setPlacements({});
    setScoreLabels({});
    setMessage("");
  }

  async function saveResults() {
    if (!event || !selectedActivity || event.status !== "live") return;
    const entries = scoringRows.flatMap((row) => {
      const placement = Math.floor(Number(placements[row.id]));
      if (!Number.isFinite(placement) || placement < 1) return [];
      return [{
        entityType,
        entityId: row.id,
        placement,
        scoreLabel: (scoreLabels[row.id] ?? "").trim() || undefined,
      }];
    });
    if (!entries.length) {
      setMessage("Enter at least one finishing place before saving results.");
      return;
    }
    setWorking(true);
    setMessage(`Saving ${selectedActivity.name} results…`);
    const response = await fetch(`/api/events/${eventId}/results`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ activityId: selectedActivity.id, source: "manual", entries }),
    });
    const data = await response.json().catch(() => ({}));
    setWorking(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save results.");
      return;
    }
    setEvent(data.event);
    setPlacements({});
    setScoreLabels({});
    const next = (data.event.activities as EventData["activities"]).find((activity) => activity.status !== "complete");
    if (next) {
      setSelectedActivityId(next.id);
      setEntityType(defaultEntityType(next.module_id));
      setMessage(`${selectedActivity.name} scored. Next: ${next.name}.`);
    } else {
      setMessage(`${selectedActivity.name} scored. Every challenge now has a result.`);
    }
  }

  async function completeEvent() {
    if (!event || !allComplete || event.status !== "live") return;
    setWorking(true);
    setMessage("Finalizing event championship…");
    const response = await fetch(`/api/events/${eventId}/complete`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setWorking(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not complete event.");
      return;
    }
    setEvent(data.event);
    setMessage("Event complete. The Event Hub standings are final.");
  }

  if (!signedIn) {
    return <main className="mx-auto w-full max-w-4xl px-4 py-16"><div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-8"><h1 className="text-3xl font-black text-white">Organizer sign-in required</h1><Link href="/games" className="mt-5 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">SIGN IN</Link></div></main>;
  }

  if (!event) {
    return <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center"><div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-8 text-white/55">{message}</div></main>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">Play Amplified Events · Control Center</div><h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{event.name}</h1><p className="mt-3 text-sm font-bold text-white/45">{event.completedActivities}/{totalActivities} challenges scored · {event.status}</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/events/organizer" className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-black text-white/60">Organizer</Link>{event.join_code ? <Link href={`/events/hub/${event.join_code}`} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">OPEN LIVE HUB</Link> : null}</div>
        </div>
      </header>

      {event.status === "published" ? <div className="mt-5 rounded-[24px] border border-amber-200/15 bg-amber-300/[0.05] p-5 text-sm font-bold text-amber-50/65">Teams are not locked yet. Start the event from the organizer page before entering results.</div> : null}
      {event.status === "complete" ? <div className="mt-5 rounded-[24px] border border-emerald-200/15 bg-emerald-300/[0.05] p-5 text-sm font-bold text-emerald-50/70">This event is final. Result entry is locked.</div> : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Challenges</div>
          <div className="mt-4 space-y-2">{event.activities.map((activity) => (
            <button key={activity.id} type="button" onClick={() => chooseActivity(activity.id)} className={`w-full rounded-2xl border px-4 py-4 text-left ${selectedActivityId === activity.id ? "border-cyan-200/30 bg-cyan-300/[0.07]" : "border-white/10 bg-black/20"}`}>
              <div className="flex items-center justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Challenge {activity.sort_order}</div><div className="mt-1 font-black text-white">{activity.name}</div></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${activity.status === "complete" ? "bg-emerald-300/10 text-emerald-100" : "bg-white/[0.06] text-white/40"}`}>{activity.status}</span></div>
            </button>
          ))}</div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
          {selectedActivity ? <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Score challenge</div><h2 className="mt-1 text-2xl font-black text-white">{selectedActivity.name}</h2><div className="mt-2 text-xs font-bold text-white/35">Game adapter target: {recommendedResultSourceForModule(selectedActivity.module_id)}</div></div><div className="flex rounded-2xl border border-white/10 bg-black/20 p-1"><button type="button" onClick={() => { setEntityType("team"); setPlacements({}); setScoreLabels({}); }} className={`rounded-xl px-3 py-2 text-xs font-black ${entityType === "team" ? "bg-cyan-300 text-slate-950" : "text-white/45"}`}>TEAMS</button><button type="button" onClick={() => { setEntityType("participant"); setPlacements({}); setScoreLabels({}); }} className={`rounded-xl px-3 py-2 text-xs font-black ${entityType === "participant" ? "bg-cyan-300 text-slate-950" : "text-white/45"}`}>INDIVIDUALS</button></div></div>
            <div className="mt-5 space-y-2">{scoringRows.map((row) => {
              const place = Math.floor(Number(placements[row.id]));
              const previewPoints = Number.isFinite(place) && place > 0 ? pointsForPlacement(place) : 0;
              return <div key={row.id} className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_100px_1fr_auto] sm:items-center"><div className="font-black text-white">{entityType === "team" ? `Team ${row.name}` : row.name}</div><input type="number" min={1} placeholder="Place" value={placements[row.id] ?? ""} onChange={(e) => setPlacements((current) => ({ ...current, [row.id]: e.target.value }))} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"/><input placeholder="Score / result label" value={scoreLabels[row.id] ?? ""} onChange={(e) => setScoreLabels((current) => ({ ...current, [row.id]: e.target.value }))} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><div className="min-w-14 text-right text-sm font-black text-cyan-100">{previewPoints ? `+${previewPoints}` : "—"}</div></div>;
            })}</div>
            <button type="button" disabled={working || event.status !== "live"} onClick={() => void saveResults()} className="mt-5 min-h-12 w-full rounded-2xl bg-cyan-300 font-black text-slate-950 disabled:opacity-40">SAVE RESULTS + UPDATE HUB</button>
            <p className="mt-3 text-xs leading-5 text-white/35">Placement points: 1st 10 · 2nd 7 · 3rd 5 · 4th 3 · 5th 2 · 6th 1. Individual points also roll into that participant&apos;s locked team total.</p>
          </> : <div className="py-12 text-center text-white/40">Choose a challenge.</div>}
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Live team board</div><div className="mt-4 space-y-2">{event.teamStandings.map((team) => <div key={team.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div className="font-black text-white">#{team.rank} Team {team.name}</div><div className="text-xl font-black text-cyan-100">{team.points}</div></div>)}</div></section>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Finish event</div><p className="mt-3 text-sm leading-6 text-white/45">Complete every challenge first. Finalizing freezes the championship state and turns the public Event Hub into the final results board.</p><button type="button" disabled={working || event.status !== "live" || !allComplete} onClick={() => void completeEvent()} className="mt-5 min-h-12 w-full rounded-2xl bg-emerald-300 font-black text-slate-950 disabled:opacity-40">COMPLETE EVENT + CROWN CHAMPION</button></section>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/50">{message || "Enter results as challenges finish. The public Event Hub refreshes every five seconds."}</div>
    </main>
  );
}
