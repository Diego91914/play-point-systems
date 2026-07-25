"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QUICK_SCORE_GAMES, type QuickScoreGameId } from "@/lib/play-point-core/quick-score";
import { ensureQuickScoreIdentity } from "@/lib/play-point-core/quick-score-identity";
import type {
  QuickScoreEventRecord,
  QuickScoreMatchRecord,
  QuickScoreClubParticipantRecord,
  QuickScoreClubSummary,
} from "@/lib/play-point-core/quick-score-club";

type ClubDetailResponse = {
  club: QuickScoreClubSummary;
  participants: QuickScoreClubParticipantRecord[];
};

type ParticipantDraftMap = Record<
  string,
  {
    displayName: string;
    status: "active" | "inactive";
  }
>;

export default function QuickScoreClubDetailPage() {
  const params = useParams<{ clubId: string }>();
  const clubId = typeof params?.clubId === "string" ? params.clubId : "";

  const [club, setClub] = useState<QuickScoreClubSummary | null>(null);
  const [participants, setParticipants] = useState<QuickScoreClubParticipantRecord[]>([]);
  const [participantDrafts, setParticipantDrafts] = useState<ParticipantDraftMap>({});
  const [clubName, setClubName] = useState("");
  const [clubLocation, setClubLocation] = useState("");
  const [clubNotes, setClubNotes] = useState("");
  const [clubStatus, setClubStatus] = useState<"active" | "archived">("active");
  const [sportKeys, setSportKeys] = useState<QuickScoreGameId[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [events, setEvents] = useState<QuickScoreEventRecord[]>([]);
  const [matches, setMatches] = useState<QuickScoreMatchRecord[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingClub, setSavingClub] = useState(false);
  const [savingParticipantId, setSavingParticipantId] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const selectedSportLabels = useMemo(() => {
    const labelMap = new Map(QUICK_SCORE_GAMES.map((game) => [game.id, game.name] as const));
    return sportKeys.map((key) => labelMap.get(key) ?? key);
  }, [sportKeys]);

  const loadClub = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await ensureQuickScoreIdentity();

      const [clubResponse, eventsResponse, matchesResponse] = await Promise.all([
        fetch(`/api/live/quick-score/clubs/${clubId}`),
        fetch(`/api/live/quick-score/clubs/${clubId}/events`),
        fetch(`/api/live/quick-score/clubs/${clubId}/matches`),
      ]);
      const [clubData, eventsData, matchesData] = await Promise.all([
        clubResponse.json().catch(() => ({})),
        eventsResponse.json().catch(() => ({})),
        matchesResponse.json().catch(() => ({})),
      ]);
      if (!clubResponse.ok) {
        throw new Error((clubData as { error?: string }).error || "Unable to load club.");
      }
      if (!eventsResponse.ok) {
        throw new Error((eventsData as { error?: string }).error || "Unable to load events.");
      }
      if (!matchesResponse.ok) {
        throw new Error((matchesData as { error?: string }).error || "Unable to load matches.");
      }

      const detail = clubData as ClubDetailResponse;
      hydrateClub(detail);
      setEvents(Array.isArray((eventsData as { events?: unknown[] }).events) ? ((eventsData as { events?: QuickScoreEventRecord[] }).events ?? []) : []);
      setMatches(Array.isArray((matchesData as { matches?: unknown[] }).matches) ? ((matchesData as { matches?: QuickScoreMatchRecord[] }).matches ?? []) : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load club.");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (!clubId) return;
    void loadClub();
  }, [clubId, loadClub]);

  function hydrateClub(detail: ClubDetailResponse) {
    setClub(detail.club);
    setParticipants(detail.participants);
    setClubName(detail.club.name);
    setClubLocation(detail.club.locationLabel ?? "");
    setClubNotes(detail.club.notes ?? "");
    setClubStatus(detail.club.status);
    setSportKeys(detail.club.sportKeys);
    setParticipantDrafts(
      Object.fromEntries(
        detail.participants.map((participant) => [
          participant.id,
          {
            displayName: participant.displayName,
            status: participant.status,
          },
        ])
      )
    );
  }

  function toggleSportKey(gameId: QuickScoreGameId) {
    setSportKeys((current) =>
      current.includes(gameId) ? current.filter((entry) => entry !== gameId) : [...current, gameId]
    );
  }

  async function saveClub() {
    if (!club) return;

    setSavingClub(true);
    setError("");
    setStatusMessage("");

    try {
      await ensureQuickScoreIdentity();
      const response = await fetch(`/api/live/quick-score/clubs/${club.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName,
          locationLabel: clubLocation,
          notes: clubNotes,
          status: clubStatus,
          sportKeys,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to save club.");
      }

      const nextClub = (data as { club?: QuickScoreClubSummary }).club;
      if (nextClub) {
        setClub(nextClub);
      }
      setStatusMessage("Club updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save club.");
    } finally {
      setSavingClub(false);
    }
  }

  async function addParticipant() {
    if (!club || !newParticipantName.trim()) {
      setError("Participant name is required.");
      return;
    }

    setAddingParticipant(true);
    setError("");
    setStatusMessage("");

    try {
      await ensureQuickScoreIdentity();
      const response = await fetch(`/api/live/quick-score/clubs/${club.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: newParticipantName,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to add participant.");
      }

      const participant = (data as { participant?: QuickScoreClubParticipantRecord }).participant;
      if (participant) {
        const nextParticipants = [...participants, participant].sort((left, right) =>
          left.displayName.localeCompare(right.displayName)
        );
        setParticipants(nextParticipants);
        setParticipantDrafts((current) => ({
          ...current,
          [participant.id]: {
            displayName: participant.displayName,
            status: participant.status,
          },
        }));
        setClub((current) =>
          current
            ? {
                ...current,
                participantCount: current.participantCount + 1,
              }
            : current
        );
      }

      setNewParticipantName("");
      setStatusMessage("Player added to the club.");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add participant.");
    } finally {
      setAddingParticipant(false);
    }
  }

  async function createEvent() {
    if (!club || !newEventName.trim()) {
      setError("Event name is required.");
      return;
    }

    setCreatingEvent(true);
    setError("");
    setStatusMessage("");

    try {
      await ensureQuickScoreIdentity();
      const response = await fetch(`/api/live/quick-score/clubs/${club.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEventName,
          eventType: "casual",
          status: "live",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to create event.");
      }

      const event = (data as { event?: QuickScoreEventRecord }).event;
      if (event) {
        setEvents((current) => [event, ...current]);
      }
      setNewEventName("");
      setStatusMessage("Event created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create event.");
    } finally {
      setCreatingEvent(false);
    }
  }

  async function saveParticipant(participantId: string) {
    const draft = participantDrafts[participantId];
    const clubRecord = club;
    if (!draft || !clubRecord) return;

    setSavingParticipantId(participantId);
    setError("");
    setStatusMessage("");

    try {
      await ensureQuickScoreIdentity();
      const response = await fetch(`/api/live/quick-score/clubs/${clubRecord.id}/participants/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: draft.displayName,
          status: draft.status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to update participant.");
      }

      const participant = (data as { participant?: QuickScoreClubParticipantRecord }).participant;
      if (participant) {
        setParticipants((current) =>
          current
            .map((entry) => (entry.id === participant.id ? participant : entry))
            .sort((left, right) => left.displayName.localeCompare(right.displayName))
        );
        setParticipantDrafts((current) => ({
          ...current,
          [participant.id]: {
            displayName: participant.displayName,
            status: participant.status,
          },
        }));
      }
      setStatusMessage("Player updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update participant.");
    } finally {
      setSavingParticipantId("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07111d] px-4 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          Loading club...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(17,28,44,0.96),rgba(11,23,40,0.92)_48%,rgba(8,14,25,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
                Play Point Live · Quick Score Club
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                {club?.name || "Quick Score Club"}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-white/74">
                This is the shell where recurring names, rivalries, and story context start to live.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/live/quick-score?clubId=${clubId}`}
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
              >
                Start Club Quick Match
              </Link>
              <Link
                href="/live/quick-score/clubs"
                className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                All Clubs
              </Link>
              <Link
                href="/live/quick-score"
                className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Back to Quick Score
              </Link>
            </div>
          </div>
        </section>

        {error && <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>}
        {statusMessage && <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{statusMessage}</div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(10,15,24,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">Club Settings</div>
            <div className="mt-2 text-2xl font-black text-white">Edit the club shell</div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <div className="text-sm font-bold text-white/84">Club name</div>
                <input
                  type="text"
                  value={clubName}
                  onChange={(event) => setClubName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/30"
                />
              </label>

              <label className="block">
                <div className="text-sm font-bold text-white/84">Location</div>
                <input
                  type="text"
                  value={clubLocation}
                  onChange={(event) => setClubLocation(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35 focus:bg-white/8"
                />
              </label>

              <label className="block">
                <div className="text-sm font-bold text-white/84">Notes</div>
                <textarea
                  rows={4}
                  value={clubNotes}
                  onChange={(event) => setClubNotes(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35 focus:bg-white/8"
                />
              </label>

              <div>
                <div className="text-sm font-bold text-white/84">Club status</div>
                <div className="mt-3 flex gap-2">
                  {(["active", "archived"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setClubStatus(status)}
                      className={[
                        "rounded-full border px-4 py-2 text-sm font-black uppercase transition",
                        clubStatus === status
                          ? "border-cyan-200/70 bg-cyan-400/16 text-cyan-50"
                          : "border-white/12 bg-white/5 text-white/74 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-white/84">Games this club plays</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_SCORE_GAMES.map((game) => {
                    const active = sportKeys.includes(game.id);
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
                  {selectedSportLabels.length > 0 ? selectedSportLabels.join(", ") : "No specific games selected yet."}
                </div>
              </div>

              <button
                type="button"
                onClick={saveClub}
                disabled={savingClub}
                className="w-full rounded-2xl bg-[linear-gradient(90deg,#7dd3fc,#67e8f9,#fcd34d)] px-5 py-4 text-base font-black text-slate-950 shadow-[0_18px_50px_rgba(125,211,252,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingClub ? "Saving Club..." : "Save Club"}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(10,15,24,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">Recurring Players</div>
                <div className="mt-2 text-2xl font-black text-white">
                  {club?.participantCount ?? participants.length} saved player{(club?.participantCount ?? participants.length) === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-bold text-white">Add player</div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(event) => setNewParticipantName(event.target.value)}
                  placeholder="Buck"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/30"
                />
                <button
                  type="button"
                  onClick={addParticipant}
                  disabled={addingParticipant}
                  className="rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingParticipant ? "Adding..." : "Add Player"}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {participants.length < 1 ? (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-white/5 px-5 py-6 text-sm leading-6 text-white/66">
                  No recurring players yet. Add the names you see every week so Phase 2 can start building streaks and rivalry context.
                </div>
              ) : (
                participants.map((participant) => {
                  const draft = participantDrafts[participant.id] ?? {
                    displayName: participant.displayName,
                    status: participant.status,
                  };
                  const isSaving = savingParticipantId === participant.id;
                  return (
                    <div
                      key={participant.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
                        <input
                          type="text"
                          value={draft.displayName}
                          onChange={(event) =>
                            setParticipantDrafts((current) => ({
                              ...current,
                              [participant.id]: {
                                ...draft,
                                displayName: event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/30"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setParticipantDrafts((current) => ({
                              ...current,
                              [participant.id]: {
                                ...draft,
                                status: draft.status === "active" ? "inactive" : "active",
                              },
                            }))
                          }
                          className={[
                            "rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition",
                            draft.status === "active"
                              ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-50"
                              : "border-white/12 bg-white/5 text-white/72 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {draft.status}
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveParticipant(participant.id)}
                          disabled={isSaving}
                          className="rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(10,15,24,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">Events</div>
            <div className="mt-2 text-2xl font-black text-white">Game nights and match buckets</div>
            <div className="mt-2 text-sm text-white/66">
              Events give your saved matches a home, whether that is one Friday night or a whole weekend.
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-bold text-white">Create event</div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={newEventName}
                  onChange={(event) => setNewEventName(event.target.value)}
                  placeholder="Friday Night Cornhole"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/30"
                />
                <button
                  type="button"
                  onClick={createEvent}
                  disabled={creatingEvent}
                  className="rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingEvent ? "Creating..." : "Create Event"}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {events.length < 1 ? (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-white/5 px-5 py-6 text-sm leading-6 text-white/66">
                  No events yet. You can still save club matches without one, but events make each night easier to organize.
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">{event.name}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.14em] text-white/48">
                          {event.eventType.replace("_", " ")} • {event.status}
                        </div>
                      </div>
                      <Link
                        href={`/live/quick-score?clubId=${clubId}&eventId=${event.id}`}
                        className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/16"
                      >
                        Score In Event
                      </Link>
                    </div>
                    {event.scheduledFor && (
                      <div className="mt-3 text-sm text-white/64">
                        Scheduled {new Date(event.scheduledFor).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(10,15,24,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/72">Recent Matches</div>
            <div className="mt-2 text-2xl font-black text-white">Saved club results</div>
            <div className="mt-2 text-sm text-white/66">
              Every saved Quick Score result becomes a memory hook for streaks, rivalries, and story cards later.
            </div>

            <div className="mt-5 space-y-3">
              {matches.length < 1 ? (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-white/5 px-5 py-6 text-sm leading-6 text-white/66">
                  No saved matches yet. Finish a Quick Score game, save it to this club, and the history starts here.
                </div>
              ) : (
                matches.slice(0, 8).map((match) => {
                  const event = events.find((entry) => entry.id === match.eventId) ?? null;
                  const competitorLabel =
                    Array.isArray(match.teamLabels) && match.teamLabels.length > 0
                      ? match.teamLabels.join(" vs ")
                      : "Saved Quick Score match";
                  return (
                    <div
                      key={match.id}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-black text-white">{competitorLabel}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.14em] text-white/48">
                            {match.sportKey} • {match.status}
                            {event ? ` • ${event.name}` : ""}
                          </div>
                        </div>
                        <div className="rounded-full border border-white/12 bg-black/20 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/72">
                          {match.completedAt
                            ? new Date(match.completedAt).toLocaleDateString()
                            : "In progress"}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-white/70">
                        {typeof match.summary.finalScoreLabel === "string"
                          ? match.summary.finalScoreLabel
                          : "Saved result"}
                      </div>
                      {typeof match.winningLabel === "string" && match.winningLabel.length > 0 && (
                        <div className="mt-2 text-sm font-semibold text-emerald-200">
                          Winner: {match.winningLabel}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
