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
  getDebugState(): FootballMvpRuntimeDebugState;
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
    if (!options.postgresRunner) {
      throw new Error(
        [
          "PLAY_POINT_LIVE_STORAGE_MODE is set to postgres,",
          "but no SqlQueryRunner was provided to createFootballMvpRuntime.",
          "Wire a real database client before enabling postgres mode.",
        ].join(" "),
      );
    }

    const repository = new PostgresPlayPointRepository(options.postgresRunner);

    return {
      seed,
      repository,
      storageMode,
      requestedStorageMode: storageResolution.requestedMode,
      persistencePath: null,
      getDebugState() {
        return {
          triggers: [],
          resolutions: [],
          rewards: [],
          note:
            "Postgres mode is enabled, but dashboard debug snapshots are still wired only for the JSON demo repository.",
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
    getDebugState() {
      return {
        triggers: repository.listTriggers(),
        resolutions: repository.listResolutions(),
        rewards: repository.listRewards(),
      };
    },
  };
}
