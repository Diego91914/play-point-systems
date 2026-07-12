import fs from "node:fs";
import path from "node:path";
import type { InMemoryPlayPointRepositorySeed } from "./football-mvp-repository";

const STATE_PATH = path.join(
  process.cwd(),
  "data",
  "play-point-live",
  "football-mvp-state.json",
);

function ensureStateDirectory() {
  fs.mkdirSync(path.dirname(STATE_PATH), {
    recursive: true,
  });
}

export function loadFootballMvpPersistedState(
  fallback: InMemoryPlayPointRepositorySeed,
): InMemoryPlayPointRepositorySeed {
  if (!fs.existsSync(STATE_PATH)) {
    return fallback;
  }

  try {
    const raw = fs.readFileSync(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as InMemoryPlayPointRepositorySeed;

    return {
      clubs: parsed.clubs ?? fallback.clubs ?? [],
      seasons: parsed.seasons ?? fallback.seasons ?? [],
      events: parsed.events ?? fallback.events ?? [],
      contests: parsed.contests ?? fallback.contests ?? [],
      entries: parsed.entries ?? fallback.entries ?? [],
      triggers: parsed.triggers ?? fallback.triggers ?? [],
      resolutions: parsed.resolutions ?? fallback.resolutions ?? [],
      rewards: parsed.rewards ?? fallback.rewards ?? [],
    };
  } catch {
    return fallback;
  }
}

export function saveFootballMvpPersistedState(
  state: InMemoryPlayPointRepositorySeed,
) {
  ensureStateDirectory();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export function getFootballMvpPersistencePath() {
  return STATE_PATH;
}
