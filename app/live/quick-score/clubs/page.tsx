"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QUICK_SCORE_GAMES, type QuickScoreGameId } from "@/lib/play-point-core/quick-score";
import { ensureQuickScoreIdentity } from "@/lib/play-point-core/quick-score-identity";
import type { QuickScoreClubSummary } from "@/lib/play-point-core/quick-score-club";

type ClubFormState = {
  name: string;
  locationLabel: string;
  notes: string;
  sportKeys: QuickScoreGameId[];
};

const EMPTY_FORM: ClubFormState = {
  name: "",
  locationLabel: "",
  notes: "",
  sportKeys: [],
};

export default function QuickScoreClubsPage() {
  const [clubs, setClubs] = useState<QuickScoreClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [form, setForm] = useState<ClubFormState>(EMPTY_FORM);

  useEffect(() => {
    void loadClubs();
  }, []);

  const selectedGameLabels = useMemo(() => {
    const labelMap = new Map(QUICK_SCORE_GAMES.map((game) => [game.id, game.name] as const));
    return form.sportKeys.map((key) => labelMap.get(key) ?? key);
  }, [form.sportKeys]);

  async function loadClubs() {
    setLoading(true);
    setError("");

    try {
      const identity = await ensureQuickScoreIdentity();
      const params = new URLSearchParams({
        playerId: identity.playerId,
        recoveryCode: identity.recoveryCode,
      });

      const response = await fetch(`/api/live/quick-score/clubs?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to load clubs.");
      }

      const nextClubs = Array.isArray((data as { clubs?: unknown[] }).clubs)
        ? ((data as { clubs?: QuickScoreClubSummary[] }).clubs ?? [])
        : [];
      setClubs(nextClubs);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load clubs.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSportKey(gameId: QuickScoreGameId) {
    setForm((current) => ({
      ...current,
      sportKeys: current.sportKeys.includes(gameId)
        ? current.sportKeys.filter((entry) => entry !== gameId)
        : [...current.sportKeys, gameId],
    }));
  }

  async function createClub() {
    if (!form.name.trim()) {
      setError("Club name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setStatusMessage("");

    try {
      const identity = await ensureQuickScoreIdentity();
      const response = await fetch("/api/live/quick-score/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: identity.playerId,
          recoveryCode: identity.recoveryCode,
          name: form.name,
          locationLabel: form.locationLabel,
          notes: form.notes,
          sportKeys: form.sportKeys,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to create club.");
      }

      const club = (data as { club?: QuickScoreClubSummary }).club;
      if (club) {
        setClubs((current) => [club, ...current]);
      }
      setForm(EMPTY_FORM);
      setStatusMessage("Club created. You can start adding your regulars now.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create club.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(17,28,44,0.96),rgba(11,23,40,0.92)_48%,rgba(8,14,25,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)] sm:p-8">
          <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Play Point Live · Quick Score Clubs
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Remember the people, not just the score.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/74">
            Clubs are the memory layer for recurring backyard groups. Quick Match stays instant, and this is where you start
            saving the names that show up every Friday night.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/live/quick-score"
              className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Back to Quick Score
            </Link>
            <Link
              href="/live"
              className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Play Point Live Home
            </Link>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-50">
              Phase 1: club shell, recurring players, and basic home screens
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(10,15,24,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">Create Club</div>
            <div className="mt-2 text-2xl font-black text-white">Start a recurring group</div>
            <div className="mt-2 text-sm text-white/68">You can use this for one game night, a season, or a whole summer.</div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <div className="text-sm font-bold text-white/84">Club name</div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Friday Night Cornhole"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/30"
                />
              </label>

              <label className="block">
                <div className="text-sm font-bold text-white/84">Location</div>
                <input
                  type="text"
                  value={form.locationLabel}
                  onChange={(event) => setForm((current) => ({ ...current, locationLabel: event.target.value }))}
                  placeholder="Back patio"
                  className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35 focus:bg-white/8"
                />
              </label>

              <label className="block">
                <div className="text-sm font-bold text-white/84">Notes</div>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={4}
                  placeholder="Mostly backyard cornhole, but spikeball and washers pop up too."
                  className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35 focus:bg-white/8"
                />
              </label>

              <div>
                <div className="text-sm font-bold text-white/84">Games this club plays</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_SCORE_GAMES.map((game) => {
                    const active = form.sportKeys.includes(game.id);
                    return (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => toggleSportKey(game.id)}
                        className={[
                          "rounded-full border px-4 py-2 text-sm font-black transition",
                          active
                            ? "border-cyan-200/70 bg-cyan-400/16 text-cyan-50"
                            : "border-white/12 bg-white/5 text-white/74 hover:bg-white/10",
                        ].join(" ")}
                      >
                        {game.name}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm text-white/56">
                  {selectedGameLabels.length > 0 ? selectedGameLabels.join(", ") : "Optional. Leave blank if the group plays a mix."}
                </div>
              </div>

              <button
                type="button"
                onClick={createClub}
                disabled={saving}
                className="w-full rounded-2xl bg-[linear-gradient(90deg,#7dd3fc,#67e8f9,#fcd34d)] px-5 py-4 text-base font-black text-slate-950 shadow-[0_18px_50px_rgba(125,211,252,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating Club..." : "Create Club"}
              </button>

              {statusMessage && <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{statusMessage}</div>}
              {error && <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(10,15,24,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">Club Home</div>
                <div className="mt-2 text-2xl font-black text-white">Your recurring groups</div>
              </div>
              <button
                type="button"
                onClick={() => void loadClubs()}
                className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/66">
                Loading your club memory layer...
              </div>
            ) : clubs.length < 1 ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-white/12 bg-white/5 px-5 py-6">
                <div className="text-lg font-black text-white">No clubs yet</div>
                <div className="mt-2 text-sm leading-6 text-white/66">
                  Start with the group you see the most. This is where head-to-heads, streaks, and rivalry stories will begin.
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {clubs.map((club) => (
                  <Link
                    key={club.id}
                    href={`/live/quick-score/clubs/${club.id}`}
                    className="block rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 transition hover:bg-white/8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-black text-white">{club.name}</div>
                        <div className="mt-2 text-sm text-white/62">
                          {club.locationLabel || "No location set"} {club.status === "archived" ? "• Archived" : ""}
                        </div>
                      </div>
                      <div className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-50">
                        {club.participantCount} player{club.participantCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {club.sportKeys.length > 0 ? (
                        club.sportKeys.map((sportKey) => {
                          const label = QUICK_SCORE_GAMES.find((game) => game.id === sportKey)?.name ?? sportKey;
                          return (
                            <span
                              key={sportKey}
                              className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62"
                            >
                              {label}
                            </span>
                          );
                        })
                      ) : (
                        <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62">
                          Mixed games
                        </span>
                      )}
                    </div>
                    {club.notes && <div className="mt-4 text-sm leading-6 text-white/68">{club.notes}</div>}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
