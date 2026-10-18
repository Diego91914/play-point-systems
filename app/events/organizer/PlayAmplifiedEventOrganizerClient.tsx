"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PLAY_AMPLIFIED_EVENT_TEMPLATES } from "@/lib/play-point-core/play-amplified-events";
import {
  balanceEventTeams,
  buildEventRunOfPlay,
  makeEventPreviewCode,
  normalizeEventSkill,
  type PlayAmplifiedEventParticipant,
} from "@/lib/play-point-core/play-amplified-event-organizer";

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
  const [participants, setParticipants] = useState<PlayAmplifiedEventParticipant[]>([
    { id: "sample-1", name: "Alex", skill: 5 },
    { id: "sample-2", name: "Jordan", skill: 4 },
    { id: "sample-3", name: "Casey", skill: 3 },
    { id: "sample-4", name: "Morgan", skill: 3 },
    { id: "sample-5", name: "Taylor", skill: 2 },
    { id: "sample-6", name: "Riley", skill: 1 },
  ]);
  const [balanced, setBalanced] = useState(false);

  const template = PLAY_AMPLIFIED_EVENT_TEMPLATES.find((item) => item.id === templateId) ?? PLAY_AMPLIFIED_EVENT_TEMPLATES[0];
  const teams = useMemo(
    () => (balanced ? balanceEventTeams(participants, teamCount) : []),
    [balanced, participants, teamCount],
  );
  const runOfPlay = useMemo(() => buildEventRunOfPlay(template.modules), [template.modules]);
  const previewCode = useMemo(() => makeEventPreviewCode(eventName), [eventName]);

  function addParticipant() {
    const name = playerName.trim();
    if (!name) return;
    setParticipants((current) => [
      ...current,
      { id: makeParticipantId(current.length + 1), name, skill: normalizeEventSkill(playerSkill) },
    ]);
    setPlayerName("");
    setBalanced(false);
  }

  function removeParticipant(id: string) {
    setParticipants((current) => current.filter((participant) => participant.id !== id));
    setBalanced(false);
  }

  if (!signedIn) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 sm:p-8">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">Play Amplified Events</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Organizer access</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
            Event creation is an organizer action. Sign in with your existing Play Amplified account before building a roster, balancing teams, or preparing the run of play.
          </p>
          <Link href="/games" className="mt-6 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">
            Open My Games / Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/55">Play Amplified Events · Organizer preview</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">Build the event before anyone arrives.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">
            This foundation proves the organizer workflow: choose the event format, build the roster, balance teams, and lock the run of play. Persistence and live player registration remain intentionally outside this preview.
          </p>
        </div>
        <Link href="/events" className="self-start rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-black text-white/75">
          Back to Events
        </Link>
      </header>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-5">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">1 · Event setup</div>
            <label className="mt-4 block text-xs font-black text-white/55">
              Event kit
              <select
                value={templateId}
                onChange={(event) => {
                  setTemplateId(event.target.value);
                  setBalanced(false);
                }}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-base font-bold text-white"
              >
                {PLAY_AMPLIFIED_EVENT_TEMPLATES.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-xs font-black text-white/55">
              Event name
              <input value={eventName} onChange={(event) => setEventName(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white" />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-black text-white/55">
                Event date
                <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white" />
              </label>
              <label className="text-xs font-black text-white/55">
                Teams
                <input type="number" min={1} max={8} value={teamCount} onChange={(event) => { setTeamCount(Math.max(1, Math.min(8, Number(event.target.value) || 1))); setBalanced(false); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white" />
              </label>
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.055] p-4">
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/50">Preview join code</div>
              <div className="mt-1 text-2xl font-black tracking-[0.18em] text-cyan-50">{previewCode}</div>
              <p className="mt-2 text-xs leading-5 text-cyan-50/55">Reserved for the future publish/QR step. This preview does not create a live event or expose a join endpoint.</p>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">2 · Roster</div>
                <div className="mt-1 text-xl font-black text-white">{participants.length} participants</div>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">Skill 1–5</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_110px_auto]">
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addParticipant(); }} placeholder="Participant name" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-white" />
              <select value={playerSkill} onChange={(event) => setPlayerSkill(Number(event.target.value))} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-black text-white">
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Skill {value}</option>)}
              </select>
              <button type="button" onClick={addParticipant} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950">Add</button>
            </div>
            <div className="mt-4 grid gap-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <div className="font-black text-white">{participant.name}</div>
                    <div className="text-xs font-bold text-white/35">Skill {participant.skill}</div>
                  </div>
                  <button type="button" onClick={() => removeParticipant(participant.id)} className="text-xs font-black uppercase tracking-[0.12em] text-white/35 hover:text-white">Remove</button>
                </div>
              ))}
            </div>
            <button type="button" disabled={!participants.length} onClick={() => setBalanced(true)} className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-300 font-black text-slate-950 disabled:opacity-40">
              BALANCE TEAMS
            </button>
          </section>
        </div>

        <div className="grid gap-5 content-start">
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.025]">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">3 · Balanced teams</div>
              <div className="mt-1 text-xl font-black text-white">{balanced ? `${teams.length} teams ready` : "Build the roster, then balance"}</div>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {balanced ? teams.map((team) => (
                <article key={team.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-white">Team {team.name}</div>
                    <div className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-black text-white/50">Skill {team.totalSkill}</div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {team.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span className="font-bold text-white/80">{member.name}</span>
                        <span className="text-white/35">{member.skill}</span>
                      </div>
                    ))}
                  </div>
                </article>
              )) : (
                <div className="sm:col-span-2 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">Automatic balancing uses the roster skill values and a snake draft so stronger and developing players are distributed across teams.</div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">4 · Run of play</div>
            <div className="mt-1 text-xl font-black text-white">{template.title}</div>
            <p className="mt-2 text-sm leading-6 text-white/45">{template.description}</p>
            <div className="mt-5 space-y-2">
              {runOfPlay.map((item) => (
                <div key={`${item.order}-${item.moduleId}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-black text-cyan-100">{item.order}</div>
                  <div className="font-black text-white">{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-amber-200/15 bg-amber-300/[0.05] p-5 sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-100/55">Foundation boundary</div>
            <p className="mt-2 text-sm leading-6 text-amber-50/65">
              Nothing on this page writes production data. The next implementation slice should add persistent events, live QR registration, organizer-owned rosters, and publish controls behind explicit server authorization.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
