export type FootballMvpStorageMode = "json" | "postgres";

const JSON_STORAGE_ALIASES = new Set(["json", "file", "filesystem", "local"]);
const POSTGRES_STORAGE_ALIASES = new Set([
  "postgres",
  "postgresql",
  "database",
  "relational",
]);

export interface FootballMvpStorageResolution {
  mode: FootballMvpStorageMode;
  requestedMode: string | null;
}

export function resolveFootballMvpStorageMode(
  env: NodeJS.ProcessEnv = process.env,
): FootballMvpStorageResolution {
  const requestedMode = env.PLAY_POINT_LIVE_STORAGE_MODE?.trim().toLowerCase() ?? null;

  if (!requestedMode || JSON_STORAGE_ALIASES.has(requestedMode)) {
    return {
      mode: "json",
      requestedMode,
    };
  }

  if (POSTGRES_STORAGE_ALIASES.has(requestedMode)) {
    return {
      mode: "postgres",
      requestedMode,
    };
  }

  return {
    mode: "json",
    requestedMode,
  };
}
