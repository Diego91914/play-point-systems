"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PublicEvent = {
  id: string;
  template_id: string;
  name: string;
  event_date: string | null;
  status: string;
  join_code: string;
  registration_open: boolean;
  activities: Array<{ module_id: string; name: string; sort_order: number; status: string }>;
};

export function EventJoinClient({ code }: { code: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Loading event…");
  const [joinedName, setJoinedName] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/events/join/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!active) return;
        if (!response.ok) {
          setStatus(data.error ?? "Event not found.");
          return;
        }
        setEvent(data.event);
        setStatus("");
      })
      .catch(() => active && setStatus("Could not load this event."));
    return () => { active = false; };
  }, [code]);

  async function join() {
    if (!name.trim()) return;
    setStatus("Checking you in…");
    const response = await fetch(`/api/events/join/${encodeURIComponent(code)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Could not join the event.");
      return;
    }
    setJoinedName(data.player?.display_name ?? name.trim());
    setStatus("");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">Play Amplified Events</div>
        {event ? (
          <>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{event.name}</h1>
            <div className="mt-2 text-sm font-bold text-white/45">
              {event.event_date ? event.event_date : "Event date to be announced"} · Code {event.join_code}
            </div>

            {joinedName ? (
              <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-5">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100/60">You’re in</div>
                <div className="mt-2 text-2xl font-black text-white">Welcome, {joinedName}.</div>
                <p className="mt-2 text-sm leading-6 text-white/55">You are checked in. Your organizer will place you on a team before the event starts.</p>
              </div>
            ) : event.registration_open ? (
              <div className="mt-6">
                <label className="block text-xs font-black text-white/55">
                  Your name
                  <input
                    value={name}
                    onChange={(input) => setName(input.target.value)}
                    onKeyDown={(key) => { if (key.key === "Enter") void join(); }}
                    placeholder="Enter your name"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base font-bold text-white"
                  />
                </label>
                <button type="button" onClick={() => void join()} disabled={!name.trim()} className="mt-3 min-h-12 w-full rounded-2xl bg-cyan-300 font-black text-slate-950 disabled:opacity-40">
                  JOIN EVENT
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-amber-200/15 bg-amber-300/[0.07] p-4 text-sm font-bold text-amber-50/70">Registration is closed. The event has started.</div>
            )}

            <div className="mt-7 border-t border-white/10 pt-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Run of play</div>
              <div className="mt-3 grid gap-2">
                {event.activities.map((activity) => (
                  <div key={`${activity.sort_order}-${activity.module_id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-black text-cyan-100">{activity.sort_order}</div>
                    <div className="font-black text-white">{activity.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-black text-white">Join an event</h1>
            <p className="mt-4 text-sm text-white/55">{status}</p>
          </>
        )}
        {status && event ? <div className="mt-3 text-center text-xs font-bold text-white/45">{status}</div> : null}
        <Link href="/play-amplified" className="mt-6 inline-flex text-xs font-black uppercase tracking-[0.14em] text-white/40 hover:text-white">Play Amplified</Link>
      </div>
    </main>
  );
}
