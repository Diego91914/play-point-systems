import "server-only";

import { Pool, type PoolConfig, type QueryResultRow } from "pg";
import type { SqlQueryRunner } from "./relational-models";

const POOL_CACHE_KEY = "__playPointLiveSupabasePool";

type GlobalPoolCache = typeof globalThis & {
  [POOL_CACHE_KEY]?: Pool;
};

function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  return (
    env.PLAY_POINT_LIVE_DATABASE_URL ??
    env.SUPABASE_DB_URL ??
    env.DATABASE_URL ??
    null
  );
}

function resolveSslConfig(
  env: NodeJS.ProcessEnv,
  databaseUrl: string,
): PoolConfig["ssl"] {
  const requested = env.PLAY_POINT_LIVE_DATABASE_SSL?.trim().toLowerCase();

  if (requested === "disable" || requested === "false" || requested === "off") {
    return false;
  }

  if (requested === "require" || requested === "true" || requested === "on") {
    return {
      rejectUnauthorized: false,
    };
  }

  return /localhost|127\.0\.0\.1/.test(databaseUrl)
    ? false
    : {
        rejectUnauthorized: false,
      };
}

function createPoolFromEnv(env: NodeJS.ProcessEnv = process.env): Pool {
  const databaseUrl = resolveDatabaseUrl(env);

  if (!databaseUrl) {
    throw new Error(
      [
        "Postgres mode requires a database connection string.",
        "Set PLAY_POINT_LIVE_DATABASE_URL, SUPABASE_DB_URL, or DATABASE_URL.",
      ].join(" "),
    );
  }

  return new Pool({
    connectionString: databaseUrl,
    ssl: resolveSslConfig(env, databaseUrl),
    max: 5,
    idleTimeoutMillis: 30_000,
    application_name: "play-point-live",
  });
}

function getOrCreatePool(env: NodeJS.ProcessEnv = process.env): Pool {
  const globalCache = globalThis as GlobalPoolCache;

  if (!globalCache[POOL_CACHE_KEY]) {
    globalCache[POOL_CACHE_KEY] = createPoolFromEnv(env);
  }

  return globalCache[POOL_CACHE_KEY] as Pool;
}

export class PgSqlQueryRunner implements SqlQueryRunner {
  constructor(private readonly pool: Pool) {}

  async query<TRow>(sql: string, params: readonly unknown[] = []): Promise<TRow[]> {
    const result = await this.pool.query<QueryResultRow>(sql, [...params]);
    return result.rows as TRow[];
  }
}

export function createSupabaseSqlRunnerFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SqlQueryRunner {
  return new PgSqlQueryRunner(getOrCreatePool(env));
}
