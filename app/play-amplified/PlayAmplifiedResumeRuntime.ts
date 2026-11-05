export type ResumeCandidate = {
  key: string;
  title: string;
  href: string;
  code?: string;
  endHref?: string;
  seenAt: number;
  clearKeys: string[];
  connection: "online" | "offline" | "reconnect";
};

type SocialResumeGame = "chain-reaction" | "how-close" | "inside-man" | "on-my-list" | "all-about-you";

type SessionSource = {
  key: string;
  title: string;
  href: string;
  game?: SocialResumeGame;
  roomApiBase?: string;
};

const SESSION_SOURCES: readonly SessionSource[] = [
  { key: "pps-mystery-session", title: "Last Call: Murder at Blackwood House", href: "/games/mystery", roomApiBase: "/api/games/mystery" },
  { key: "pps-chain-reaction-session", title: "Chain Reaction", href: "/games/chain-reaction", game: "chain-reaction" },
  { key: "pps-how-close-session", title: "How Close Are We?", href: "/games/how-close", game: "how-close" },
  { key: "pps-inside-man-session", title: "The Inside Man", href: "/games/inside-man", game: "inside-man" },
  { key: "pps-on-my-list-session", title: "On My List", href: "/games/on-my-list", game: "on-my-list" },
  { key: "pps-all-about-you-session", title: "All About You", href: "/games/all-about-you", game: "all-about-you" },
];

function readJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function terminalStatus(payload: Record<string, unknown> | null) {
  const nestedState = payload?.state && typeof payload.state === "object" ? payload.state as Record<string, unknown> : null;
  const status = typeof nestedState?.status === "string"
    ? nestedState.status
    : typeof payload?.status === "string"
      ? payload.status
      : "";
  return ["completed", "ended", "closed"].includes(status.toLowerCase());
}

async function validateSessionSource(source: SessionSource): Promise<ResumeCandidate | null> {
  const clearKeys = [source.key];
  const parsed = readJson(window.localStorage.getItem(source.key));
  if (!parsed) return null;

  const code = typeof parsed.code === "string" ? parsed.code.trim().toUpperCase() : "";
  const playerId = typeof parsed.playerId === "string" ? parsed.playerId : "";
  const token = typeof parsed.token === "string" ? parsed.token : "";
  if (!/^[A-Z2-9]{6}$/.test(code) || !playerId || !token) {
    return null;
  }

  const seenAt = typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0;
  let connection: ResumeCandidate["connection"] = "online";

  try {
    if (source.game) {
      const response = await fetch("/api/games/social-room-control", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", game: source.game, code, playerId, token }),
      });
      if (!response.ok) {
        connection = response.status >= 500 ? "offline" : "reconnect";
      } else {
        const payload = await response.json().catch(() => ({}));
        if (payload?.ended === true) return null;
      }
    } else if (source.roomApiBase) {
      const response = await fetch(
        `${source.roomApiBase}/${encodeURIComponent(code)}?playerId=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        connection = response.status >= 500 ? "offline" : "reconnect";
      } else {
        const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (terminalStatus(payload)) return null;
      }
    }
  } catch {
    connection = "offline";
  }

  return {
    key: source.key,
    title: source.title,
    href: `${source.href}?code=${encodeURIComponent(code)}`,
    code,
    seenAt,
    clearKeys,
    connection,
  };
}

async function validateHoldemSession(storageKey: string): Promise<ResumeCandidate | null> {
  const match = storageKey.match(/^pps-holdem-([A-Z2-9]{6})$/i);
  if (!match) return null;

  const code = match[1].toUpperCase();
  const clearKeys = [storageKey];
  const parsed = readJson(window.localStorage.getItem(storageKey));
  const playerId = typeof parsed?.playerId === "string" ? parsed.playerId : "";
  const token = typeof parsed?.token === "string" ? parsed.token : "";
  if (!playerId || !token) {
    return null;
  }

  const seenAt = typeof parsed?.updatedAt === "number" ? parsed.updatedAt : 0;
  let connection: ResumeCandidate["connection"] = "online";

  try {
    const response = await fetch("/api/games/social-room-control", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "status", game: "holdem", code, playerId, token }),
    });
    if (!response.ok) {
      connection = response.status >= 500 ? "offline" : "reconnect";
    } else {
      const payload = await response.json().catch(() => ({}));
      if (payload?.ended === true) return null;
    }
  } catch {
    connection = "offline";
  }

  return {
    key: storageKey,
    title: "Phone Hold'em",
    href: `/games/holdem?code=${encodeURIComponent(code)}`,
    code,
    seenAt,
    clearKeys,
    connection,
  };
}

async function validateTriviaResume(): Promise<ResumeCandidate | null> {
  const hostKey = "play-point-trivia-host-connection-v2";
  const host = readJson(window.localStorage.getItem(hostKey));
  const hostSessionId = typeof host?.sessionId === "string" ? host.sessionId : "";
  if (hostSessionId) {
    let connection: ResumeCandidate["connection"] = "offline";
    try {
      const response = await fetch(`/api/trivia/sessions/${encodeURIComponent(hostSessionId)}`, { cache: "no-store" });
      if (response.ok) {
        connection = "online";
        const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (terminalStatus(payload)) return null;
        return { key: hostKey, title: "Play Point Trivia", href: "/games/trivia/builder", seenAt: 0, clearKeys: [hostKey], connection };
      } else {
        connection = response.status >= 500 ? "offline" : "reconnect";
      }
    } catch {}
    // The server or connection may be unavailable while the local credential is
    // still valid. Keep it and offer the saved route so the game can retry.
    if (hostSessionId) return { key: hostKey, title: "Play Point Trivia", href: "/games/trivia/builder", seenAt: 0, clearKeys: [hostKey], connection };
  }

  const playerKey = "play-point-trivia-player-connection-v2";
  const player = readJson(window.localStorage.getItem(playerKey));
  const sessionId = typeof player?.sessionId === "string" ? player.sessionId : "";
  const playerId = typeof player?.playerId === "string" ? player.playerId : "";
  const roomCode = typeof player?.roomCode === "string" ? player.roomCode.trim().toUpperCase() : "";
  if (!sessionId || !playerId || !/^[A-Z2-9]{6}$/.test(roomCode)) {
    return null;
  }

  try {
    const response = await fetch(
      `/api/trivia/sessions/${encodeURIComponent(sessionId)}/players/${encodeURIComponent(playerId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return { key: playerKey, title: "Play Point Trivia", href: `/games/trivia/join?code=${encodeURIComponent(roomCode)}`, code: roomCode, seenAt: 0, clearKeys: [playerKey], connection: response.status >= 500 ? "offline" : "reconnect" };
    }
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (terminalStatus(payload)) return null;
  } catch {
    return { key: playerKey, title: "Play Point Trivia", href: `/games/trivia/join?code=${encodeURIComponent(roomCode)}`, code: roomCode, seenAt: 0, clearKeys: [playerKey], connection: "offline" };
  }

  return {
    key: playerKey,
    title: "Play Point Trivia",
    href: `/games/trivia/join?code=${encodeURIComponent(roomCode)}`,
    code: roomCode,
    seenAt: 0,
    clearKeys: [playerKey],
    connection: "online",
  };
}

async function validateClearStackResume(): Promise<ResumeCandidate | null> {
  const key = "pps-clear-stack-host-room";
  let savedId: string | null = null;
  try { savedId = window.localStorage.getItem(key); } catch {}
  const fallback = (connection: ResumeCandidate["connection"]): ResumeCandidate | null => savedId
    ? { key, title: "Clear the Stack", href: "/games/clear-the-stack", seenAt: 0, clearKeys: [key], connection }
    : null;
  try {
    const response = await fetch("/api/games/clear-the-stack/room", { cache: "no-store" });
    if (!response.ok) return fallback(response.status >= 500 ? "offline" : "reconnect");
    const payload = await response.json();
    const room = payload?.room;
    if (room === null) return null;
    if (!room?.id || !room.game_state || !["setup", "playing", "finished"].includes(room.game_state.phase)) return fallback("reconnect");
    const updated = Date.parse(room.updated_at);
    return { key, title: "Clear the Stack", href: "/games/clear-the-stack", code: room.code,
      seenAt: Number.isFinite(updated) ? updated : 0, clearKeys: [key], connection: "online" };
  } catch { return fallback("offline"); }
}

async function validateShotCaddyResume(): Promise<ResumeCandidate | null> {
  const resumeKey = "sc_active_round_resumes_v1";
  const entries = readJson(window.localStorage.getItem(resumeKey));
  const resumes = entries
    ? Object.values(entries).filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item)))
    : [];
  const legacyCode = window.localStorage.getItem("sc_last_session_code")?.trim().toUpperCase() ?? "";
  if (legacyCode && !resumes.some((item) => item.sessionCode === legacyCode)) {
    resumes.push({
      sessionCode: legacyCode,
      playerId: window.localStorage.getItem("sc_last_player_id") ?? "",
      playerName: window.localStorage.getItem("sc_last_player_name") ?? "",
      updatedAt: 0,
      gameMode: "LEGACY_UNKNOWN",
    });
  }
  const ranked = resumes
    .filter((resume) => typeof resume.sessionCode === "string" && /^[A-Z0-9]{6,8}$/.test(resume.sessionCode))
    .sort((a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0));

  for (const saved of ranked) {
    const code = String(saved.sessionCode);
    try {
      const response = await fetch(`/shot-caddy/api/sessions/${encodeURIComponent(code)}`, { cache: "no-store" });
      if (!response.ok) continue;
      const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
      const round = payload?.roundState as Record<string, unknown> | undefined;
      if (!round || typeof round !== "object" || round.hostEndedAt || round.roundEndedAt) continue;
      const mode = typeof round.gameMode === "string" ? round.gameMode : "";
      if (typeof saved.gameMode === "string" && saved.gameMode !== "LEGACY_UNKNOWN" && saved.gameMode !== mode) continue;

      const playerId = typeof saved.playerId === "string" ? saved.playerId : "";
      const playerName = typeof saved.playerName === "string" ? saved.playerName : "";
      const params = new URLSearchParams();
      if (playerId) params.set("resumePlayerId", playerId);
      if (playerName) params.set("resumePlayerName", playerName);
      const resumeParams = params.toString();
      const href = `/shot-caddy/join/${encodeURIComponent(code)}${resumeParams ? `?${resumeParams}` : ""}`;
      const hostPlayerId = typeof round.hostPlayerId === "string" ? round.hostPlayerId : "";
      const isHost = Boolean(playerId && hostPlayerId && playerId === hostPlayerId);
      if (isHost) params.set("dest", "summary");

      return {
        key: `shot-caddy:${code}`,
        title: mode === "CHALLENGE_SKINS_PRO" ? "Challenge Skins Pro" : "Shot Caddy",
        href,
        endHref: isHost ? `/shot-caddy/join/${encodeURIComponent(code)}?${params.toString()}` : undefined,
        code,
        seenAt: typeof saved.updatedAt === "number" ? saved.updatedAt : 0,
        // This is a live round. Never delete its resume pointer from Play Amplified.
        clearKeys: [],
        connection: "online",
      };
    } catch {
      // Offline or temporarily unavailable server: leave recovery data intact.
    }
  }
  return null;
}

export async function readResumeCandidates(): Promise<ResumeCandidate[]> {
  const localKeys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && /^pps-holdem-[A-Z2-9]{6}$/i.test(key)) localKeys.push(key);
  }

  const [roomCandidates, holdemCandidates, triviaCandidate, stackCandidate, shotCaddyCandidate] = await Promise.all([
    Promise.all(SESSION_SOURCES.map((source) => validateSessionSource(source))),
    Promise.all(localKeys.map((key) => validateHoldemSession(key))),
    validateTriviaResume(),
    validateClearStackResume(),
    validateShotCaddyResume(),
  ]);

  return [...roomCandidates, ...holdemCandidates, triviaCandidate, stackCandidate, shotCaddyCandidate]
    .filter((candidate): candidate is ResumeCandidate => candidate !== null)
    .sort((a, b) => b.seenAt - a.seenAt);
}
