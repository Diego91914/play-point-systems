"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PLAY_AMPLIFIED_EVENT_TEMPLATES } from "@/lib/play-point-core/play-amplified-events";
import {
  balanceEventTeams,
  buildEventRunOfPlay,
  normalizeEventSkill,
  type PlayAmplifiedEventParticipant,
} from "@/lib/play-point-core/play-amplified-event-organizer";

type EventParticipant = PlayAmplifiedEventParticipant & { source?: string; checkedIn?: boolean };
type EventSummary = { id: string; name: string; event_date: string | null; status: string; join_code: string | null };

type StoredEvent = {
  id: string;
  template_id: string;
  name: string;
  event_date: string | null;
  status: string;
  join_code: string | null;
  team_count: number;
  registration_open: boolean;
  participants: Array<{ id: string; name: string; skill: number; source: string; checkedIn: boolean }>;
  activities: Array<{ module_id: string; name: string; sort_order: number }>;
  teams: Array<{ id: string; name: string; sort_order: number; total_skill: number; participantIds: string[] }>;
};

function makeParticipantId(index: number) {
  return `participant-${Date.now()}-${index}`;
}

export function PlayAmplifiedEventOrganizerClient({ signedIn }: { signedIn: boolean }) {
  const [templateId, setTemplateId] = useState("corporate-challenge");
  const [eventName, setEventName] = useState("Company Team Challenge");
  const [eventDate, setEventDate] = useState("");
  const [teamCount, setTeamCount] = useState(3);
  const [playerName, setPlayerName] = useState("");
  const [playerSkill, setPlayerSkill] = useState(3);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [balanced, setBalanced] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState("draft");
  const [joinCode, setJoinCode] = useState("");
  const [recentEvents, setRecentEvents] = useState<EventSummary[]>([]);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  const template = PLAY_AMPLIFIED_EVENT_TEMPLATES.find((item) => item.id === templateId) ?? PLAY_AMPLIFIED_EVENT_TEMPLATES[0];
  const teams = useMemo(() => (balanced ? balanceEventTeams(participants, teamCount) : []), [balanced, participants, teamCount]);
  const runOfPlay = useMemo(() => buildEventRunOfPlay(template.modules), [template.modules]);
  const joinUrl = joinCode && typeof window !== "undefined" ? `${window.location.origin}/events/join/${joinCode}` : "";
  const draftLocked = eventStatus !== "draft";

  const applyStoredEvent = useCallback((event: StoredEvent) => {
    setEventId(event.id);
    setTemplateId(event.template_id);
    setEventName(event.name);
    setEventDate(event.event_date ?? "");
    setTeamCount(event.team_count);
    setEventStatus(event.status);
    setJoinCode(event.join_code ?? "");
    setParticipants(event.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      skill: participant.skill,
      source: participant.source,
      checkedIn: participant.checkedIn,
    })));
    setBalanced(event.teams.length > 0);
  }, []);

  const loadEvents = useCallback(async () => {
    if (!signedIn) return;
    const response = await fetch("/api/events", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setRecentEvents(data.events ?? []);
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    void fetch("/api/events", { cache: "no-store", signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!controller.signal.aborted && data) setRecentEvents(data.events ?? []);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [signedIn]);

  async function openEvent(id: string) {
    setWorking(true);
    setMessage("Loading event…");
    const response = await fetch(`/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not load event.");
      return;
    }
    applyStoredEvent(data.event);
    setMessage("Event loaded.");
  }

  function addParticipant() {
    if (draftLocked) return;
    const name = playerName.trim();
    if (!name) return;
    setParticipants((current) => [...current, { id: makeParticipantId(current.length + 1), name, skill: normalizeEventSkill(playerSkill), source: "organizer", checkedIn: false }]);
    setPlayerName("");
    setBalanced(false);
  }

  function removeParticipant(id: string) {
    if (draftLocked) return;
    setParticipants((current) => current.filter((participant) => participant.id !== id));
    setBalanced(false);
  }

  function draftPayload() {
    return {
      templateId,
      name: eventName,
      eventDate,
      teamCount,
      participants: participants.filter((participant) => participant.source !== "qr").map((participant) => ({ id: participant.id, name: participant.name, skill: participant.skill })),
    };
  }

  async function saveDraft() {
    if (draftLocked) {
      setMessage("Published events are locked. Refresh registrations and start the event instead.");
      return null;
    }
    setWorking(true);
    setMessage(eventId ? "Saving draft…" : "Creating draft…");
    const response = await fetch(eventId ? `/api/events/${eventId}` : "/api/events", {
      method: eventId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draftPayload()),
    });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save event.");
      return null;
    }
    applyStoredEvent(data.event);
    setMessage("Draft saved.");
    void loadEvents();
    return data.event as StoredEvent;
  }

  async function publishEvent() {
    const saved = eventId ? null : await saveDraft();
    const id = eventId ?? saved?.id;
    if (!id) return;
    setWorking(true);
    setMessage("Publishing registration…");
    const response = await fetch(`/api/events/${id}/publish`, { method: "POST" });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not publish event.");
      return;
    }
    applyStoredEvent(data.event);
    setMessage("Registration is open. Share the QR code.");
    void loadEvents();
  }

  async function refreshRoster() {
    if (!eventId) return;
    setWorking(true);
    setMessage("Refreshing registrations…");
    const response = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not refresh roster.");
      return;
    }
    applyStoredEvent(data.event);
    setBalanced(false);
    setMessage("Roster refreshed.");
  }

  async function startEvent() {
    if (!eventId || eventStatus !== "published") return;
    if (!participants.length) {
      setMessage("At least one participant is required before starting.");
      return;
    }
    const startTeams = balanceEventTeams(participants, teamCount);
    setWorking(true);
    setMessage("Locking teams and starting event…");
    const response = await fetch(`/api/events/${eventId}/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teams: startTeams.map((team) => ({ name: team.name, totalSkill: team.totalSkill, participantIds: team.members.map((member) => member.id) })) }),
    });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not start event.");
      return;
    }
    applyStoredEvent(data.event);
    setBalanced(true);
    setMessage("Event started. Registration is closed and teams are locked.");
    void loadEvents();
  }

  if (!signedIn) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 sm:p-8">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">Play Amplified Events</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Organizer access</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">Sign in with your Play Amplified account to create, publish, and run an event.</p>
          <Link href="/games" className="mt-6 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">Open My Games / Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/55">Play Amplified Events · Organizer</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">Build it. Open registration. Start together.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">Draft the event, publish one QR join point, refresh the live roster, balance teams, then lock the event when play begins.</p>
        </div>
        <Link href="/events" className="self-start rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-black text-white/75">Back to Events</Link>
      </header>

      {recentEvents.length ? (
        <section className="mb-5 rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Your recent events</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentEvents.map((event) => (
              <button key={event.id} type="button" onClick={() => void openEvent(event.id)} className={`rounded-full border px-3 py-2 text-xs font-black ${eventId === event.id ? "border-cyan-200/35 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-black/20 text-white/55"}`}>
                {event.name} · {event.status}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-5 content-start">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">1 · Event setup</div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase text-white/45">{eventStatus}</span></div>
            <label className="mt-4 block text-xs font-black text-white/55">Event kit
              <select disabled={draftLocked} value={templateId} onChange={(event) => { setTemplateId(event.target.value); setBalanced(false); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-base font-bold text-white disabled:opacity-55">
                {PLAY_AMPLIFIED_EVENT_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-xs font-black text-white/55">Event name
              <input disabled={draftLocked} value={eventName} onChange={(event) => setEventName(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white disabled:opacity-55" />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-black text-white/55">Event date<input disabled={draftLocked} type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white disabled:opacity-55" /></label>
              <label className="text-xs font-black text-white/55">Teams<input disabled={draftLocked} type="number" min={1} max={8} value={teamCount} onChange={(event) => { setTeamCount(Math.max(1, Math.min(8, Number(event.target.value) || 1))); setBalanced(false); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white disabled:opacity-55" /></label>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={working || draftLocked} onClick={() => void saveDraft()} className="min-h-12 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 font-black text-cyan-50 disabled:opacity-40">SAVE DRAFT</button>
              <button type="button" disabled={working || eventStatus !== "draft"} onClick={() => void publishEvent()} className="min-h-12 rounded-2xl bg-cyan-300 font-black text-slate-950 disabled:opacity-40">PUBLISH + OPEN QR</button>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">2 · Roster</div><div className="mt-1 text-xl font-black text-white">{participants.length} participants</div></div>{eventStatus === "published" ? <button type="button" disabled={working} onClick={() => void refreshRoster()} className="rounded-full border border-white/12 px-3 py-2 text-xs font-black text-white/60">Refresh QR joins</button> : null}</div>
            {!draftLocked ? <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_110px_auto]"><input value={playerName} onChange={(event) => setPlayerName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addParticipant(); }} placeholder="Participant name" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white" /><select value={playerSkill} onChange={(event) => setPlayerSkill(Number(event.target.value))} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-black text-white">{[1,2,3,4,5].map((value) => <option key={value} value={value}>Skill {value}</option>)}</select><button type="button" onClick={addParticipant} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950">Add</button></div> : null}
            <div className="mt-4 grid gap-2">{participants.length ? participants.map((participant) => <div key={participant.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div><div className="font-black text-white">{participant.name}</div><div className="text-xs font-bold text-white/35">Skill {participant.skill}{participant.source === "qr" ? " · QR registration" : participant.checkedIn ? " · Checked in" : ""}</div></div>{!draftLocked ? <button type="button" onClick={() => removeParticipant(participant.id)} className="text-xs font-black uppercase tracking-[0.12em] text-white/35 hover:text-white">Remove</button> : null}</div>) : <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/35">Add the roster now, or publish the event and let participants scan in.</div>}</div>
            <button type="button" disabled={!participants.length} onClick={() => setBalanced(true)} className="mt-4 min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.06] font-black text-white disabled:opacity-40">PREVIEW BALANCED TEAMS</button>
          </section>
        </div>

        <div className="grid gap-5 content-start">
          {joinCode ? <section className="rounded-[28px] border border-cyan-200/15 bg-cyan-300/[0.05] p-5 sm:p-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/55">Live registration</div><div className="mt-2 text-3xl font-black tracking-[0.18em] text-cyan-50">{joinCode}</div>{joinUrl ? <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center"><div className="w-fit rounded-2xl bg-white p-3"><QRCodeSVG value={joinUrl} size={176} level="M" includeMargin /></div><div className="min-w-0"><div className="break-all text-sm font-bold text-cyan-50/75">{joinUrl}</div><p className="mt-2 text-xs leading-5 text-white/45">Participants scan once, enter their name, and appear on the organizer roster. Registration closes when you start the event.</p></div></div> : null}</section> : null}

          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.025]"><div className="border-b border-white/10 px-5 py-4 sm:px-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">3 · Teams</div><div className="mt-1 text-xl font-black text-white">{balanced ? `${teams.length} teams ready` : "Balance when the roster is ready"}</div></div><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">{balanced ? teams.map((team) => <article key={team.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between gap-3"><div className="font-black text-white">Team {team.name}</div><div className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-black text-white/50">Skill {team.totalSkill}</div></div><div className="mt-3 space-y-2">{team.members.map((member) => <div key={member.id} className="flex items-center justify-between text-sm"><span className="font-bold text-white/80">{member.name}</span><span className="text-white/35">{member.skill}</span></div>)}</div></article>) : <div className="sm:col-span-2 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">Automatic balancing distributes stronger and developing players across teams with a snake draft.</div>}</div>{eventStatus === "published" ? <div className="border-t border-white/10 p-5 sm:p-6"><button type="button" disabled={working || !participants.length} onClick={() => void startEvent()} className="min-h-12 w-full rounded-2xl bg-emerald-300 font-black text-slate-950 disabled:opacity-40">LOCK TEAMS + START EVENT</button></div> : null}</section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">4 · Run of play</div><div className="mt-1 text-xl font-black text-white">{template.title}</div><div className="mt-5 space-y-2">{runOfPlay.map((item) => <div key={`${item.order}-${item.moduleId}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-black text-cyan-100">{item.order}</div><div className="font-black text-white">{item.label}</div></div>)}</div></section>

          <section className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/50">{message || "Draft changes stay private until you publish registration."}</section>
        </div>
      </div>
    </main>
  );
}
