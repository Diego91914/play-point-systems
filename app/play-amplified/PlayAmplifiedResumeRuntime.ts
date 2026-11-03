export type ResumeCandidate = {
  key: string;
  title: string;
  href: string;
  code?: string;
  seenAt: number;
  clearKeys: string[];
  /** End routes to the game’s own confirmation/scorecard; no history is erased here. */
  endHref?: string;
};

type SocialResumeGame = "chain-reaction" | "how-close" | "inside-man" | "on-my-list" | "all-about-you";

type SessionSource = {
  key: string;
  title: string;
  href: string;
  game?: SocialResumeGame;
  roomApiBase?: string;
};

const RESUME_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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

function removeLocalKeys(keys: readonly string[]) {
  try {
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {}
}

function readRecentRetention(storageKey: string, code: string) {
  const retentionKey = `${storageKey}:retention`;
  const meta = readJson(window.localStorage.getItem(retentionKey));
  const metaCode = typeof meta?.code === "string" ? meta.code.trim().toUpperCase() : "";
  const firstSeenAt = typeof meta?.firstSeenAt === "number" ? meta.firstSeenAt : Number.NaN;
  if (metaCode !== code || !Number.isFinite(firstSeenAt)) return null;
  if (Date.now() - firstSeenAt > RESUME_MAX_AGE_MS) return null;
  return firstSeenAt;
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
  const clearKeys = [source.key, `${source.key}:retention`];
  const parsed = readJson(window.localStorage.getItem(source.key));
  if (!parsed) return null;

  const code = typeof parsed.code === "string" ? parsed.code.trim().toUpperCase() : "";
  const playerId = typeof parsed.playerId === "string" ? parsed.playerId : "";
  const token = typeof parsed.token === "string" ? parsed.token : "";
  if (!/^[A-Z2-9]{6}$/.test(code) || !playerId || !token) {
    removeLocalKeys(clearKeys);
    return null;
  }

  const seenAt = readRecentRetention(source.key, code);
  if (seenAt === null) {
    removeLocalKeys(clearKeys);
    return null;
  }

  try {
    if (source.game) {
      const response = await fetch("/api/games/social-room-control", {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "status", game: source.game, code, playerId, token }),
      });
      if (!response.ok) {
        if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys(clearKeys);
        return null;
      }
      const payload = await response.json().catch(() => ({}));
      if (payload?.ended === true) {
        removeLocalKeys(clearKeys);
        return null;
      }
    } else if (source.roomApiBase) {
      const response = await fetch(
        `${source.roomApiBase}/${encodeURIComponent(code)}?playerId=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys(clearKeys);
        return null;
      }
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (terminalStatus(payload)) {
        removeLocalKeys(clearKeys);
        return null;
      }
    }
  } catch {
    return null;
  }

  return {
    key: source.key,
    title: source.title,
    href: `${source.href}?code=${encodeURIComponent(code)}`,
    code,
    seenAt,
    clearKeys,
  };
}

async function validateHoldemSession(storageKey: string): Promise<ResumeCandidate | null> {
  const match = storageKey.match(/^pps-holdem-([A-Z2-9]{6})$/i);
  if (!match) return null;

  const code = match[1].toUpperCase();
  const clearKeys = [storageKey, `${storageKey}:retention`];
  const parsed = readJson(window.localStorage.getItem(storageKey));
  const playerId = typeof parsed?.playerId === "string" ? parsed.playerId : "";
  const token = typeof parsed?.token === "string" ? parsed.token : "";
  if (!playerId || !token) {
    removeLocalKeys(clearKeys);
    return null;
  }

  const seenAt = readRecentRetention(storageKey, code);
  if (seenAt === null) {
    removeLocalKeys(clearKeys);
    return null;
  }

  try {
    const response = await fetch("/api/games/social-room-control", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "status", game: "holdem", code, playerId, token }),
    });
    if (!response.ok) {
      if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys(clearKeys);
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (payload?.ended === true) {
      removeLocalKeys(clearKeys);
      return null;
    }
  } catch {
    return null;
  }

  return {
    key: storageKey,
    title: "Phone Hold'em",
    href: `/games/holdem?code=${encodeURIComponent(code)}`,
    code,
    seenAt,
    clearKeys,
  };
}

async function validateTriviaResume(): Promise<ResumeCandidate | null> {
  const hostKey = "play-point-trivia-host-connection-v2";
  const host = readJson(window.localStorage.getItem(hostKey));
  const hostSessionId = typeof host?.sessionId === "string" ? host.sessionId : "";
  if (hostSessionId) {
    try {
      const response = await fetch(`/api/trivia/sessions/${encodeURIComponent(hostSessionId)}`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (!terminalStatus(payload)) {
          return {
            key: hostKey,
            title: "Play Point Trivia",
            href: "/games/trivia/builder",
            seenAt: 0,
            clearKeys: [hostKey],
          };
        }
        removeLocalKeys([hostKey]);
      } else if ([401, 403, 404, 410].includes(response.status)) {
        removeLocalKeys([hostKey]);
      }
    } catch {}
  }

  const playerKey = "play-point-trivia-player-connection-v2";
  const player = readJson(window.localStorage.getItem(playerKey));
  const sessionId = typeof player?.sessionId === "string" ? player.sessionId : "";
  const playerId = typeof player?.playerId === "string" ? player.playerId : "";
  const roomCode = typeof player?.roomCode === "string" ? player.roomCode.trim().toUpperCase() : "";
  if (!sessionId || !playerId || !/^[A-Z2-9]{6}$/.test(roomCode)) {
    if (player) removeLocalKeys([playerKey]);
    return null;
  }

  try {
    const response = await fetch(
      `/api/trivia/sessions/${encodeURIComponent(sessionId)}/players/${encodeURIComponent(playerId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      if ([401, 403, 404, 410].includes(response.status)) removeLocalKeys([playerKey]);
      return null;
    }
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (terminalStatus(payload)) {
      removeLocalKeys([playerKey]);
      return null;
    }
  } catch {
    return null;
  }

  return {
    key: playerKey,
    title: "Play Point Trivia",
    href: `/games/trivia/join?code=${encodeURIComponent(roomCode)}`,
    code: roomCode,
    seenAt: 0,
    clearKeys: [playerKey],
  };
}


/**
 * Shot Caddy is served as a /shot-caddy zone on the very same Play Amplified
 * origin. Its active-round resume record was previously ignored by the PWA.
 * Validate the canonical round before offering Resume; do not delete local
 * recovery state after network errors.
 */
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

  const [roomCandidates, holdemCandidates, triviaCandidate, shotCaddyCandidate] = await Promise.all([
    Promise.all(SESSION_SOURCES.map((source) => validateSessionSource(source))),
    Promise.all(localKeys.map((key) => validateHoldemSession(key))),
    validateTriviaResume(),
    validateShotCaddyResume(),
  ]);

  return [...roomCandidates, ...holdemCandidates, triviaCandidate, shotCaddyCandidate]
    .filter((candidate): candidate is ResumeCandidate => candidate !== null)
    .sort((a, b) => b.seenAt - a.seenAt);
}
