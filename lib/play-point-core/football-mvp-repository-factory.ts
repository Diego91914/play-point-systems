import {
  getFootballMvpPersistencePath,
  loadFootballMvpPersistedState,
  saveFootballMvpPersistedState,
} from "./football-mvp-persistence";
import {
  createFootballMvpSeedData,
  InMemoryPlayPointRepository,
  type InMemoryPlayPointRepositorySeed,
} from "./football-mvp-repository";
import {
  resolveFootballMvpStorageMode,
  type FootballMvpStorageMode,
} from "./football-mvp-storage";
import { PostgresPlayPointRepository } from "./postgres-play-point-repository";
import { createSupabaseSqlRunnerFromEnv } from "./supabase-sql-runner";
import type { SqlQueryRunner } from "./relational-models";
import type {
  PlayPointRepository,
  PlayPointTrigger,
  ResolutionRow,
  RewardRow,
} from "./runtime-contracts";

export interface FootballMvpRuntimeDebugState {
  triggers: PlayPointTrigger[];
  resolutions: ResolutionRow[];
  rewards: RewardRow[];
  note?: string | null;
}

export interface FootballMvpRepositoryBinding {
  seed: InMemoryPlayPointRepositorySeed;
  repository: PlayPointRepository;
  storageMode: FootballMvpStorageMode;
  requestedStorageMode: string | null;
  persistencePath: string | null;
  getDebugState(): Promise<FootballMvpRuntimeDebugState>;
}

export interface CreateFootballMvpRepositoryOptions {
  seed?: InMemoryPlayPointRepositorySeed;
  storageMode?: FootballMvpStorageMode;
  postgresRunner?: SqlQueryRunner;
}

export function createFootballMvpRepositoryBinding(
  options: CreateFootballMvpRepositoryOptions = {},
): FootballMvpRepositoryBinding {
  const storageResolution = resolveFootballMvpStorageMode();
  const storageMode = options.storageMode ?? storageResolution.mode;
  const seed = options.seed ?? createFootballMvpSeedData();

  if (storageMode === "postgres") {
    const runner =
      options.postgresRunner ?? createSupabaseSqlRunnerFromEnv(process.env);
    const repository = new PostgresPlayPointRepository(runner);
    const primaryEventId = seed.events?.[0]?.id ?? null;

    return {
      seed,
      repository,
      storageMode,
      requestedStorageMode: storageResolution.requestedMode,
      persistencePath: null,
      async getDebugState() {
        if (!primaryEventId) {
          return {
            triggers: [],
            resolutions: [],
            rewards: [],
            note:
              "Postgres mode is enabled, but no primary seed event is available for debug hydration.",
          };
        }

        return {
          triggers: await repository.listEventTriggers(primaryEventId),
          resolutions: await repository.listEventResolutions(primaryEventId),
          rewards: await repository.listEventRewards(primaryEventId),
        };
      },
    };
  }

  const persistedSeed = loadFootballMvpPersistedState(seed);
  const repository = new InMemoryPlayPointRepository(
    persistedSeed,
    saveFootballMvpPersistedState,
  );

  return {
    seed: persistedSeed,
    repository,
    storageMode,
    requestedStorageMode: storageResolution.requestedMode,
    persistencePath: getFootballMvpPersistencePath(),
    async getDebugState() {
      return {
        triggers: repository.listTriggers(),
        resolutions: repository.listResolutions(),
        rewards: repository.listRewards(),
      };
    },
  };
}
