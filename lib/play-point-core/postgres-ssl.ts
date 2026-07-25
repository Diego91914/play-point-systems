export type PostgresSslConfig = false | {
  rejectUnauthorized: true;
  ca?: string;
};

function isLocalDatabaseUrl(databaseUrl: string): boolean {
  try {
    const hostname = new URL(databaseUrl).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function resolvePostgresSslConfig(
  env: NodeJS.ProcessEnv,
  databaseUrl: string
): PostgresSslConfig {
  const requested = env.PLAY_POINT_LIVE_DATABASE_SSL?.trim().toLowerCase();
  const localDatabase = isLocalDatabaseUrl(databaseUrl);

  if (requested === "disable" || requested === "false" || requested === "off") {
    if (!localDatabase) {
      throw new Error("Postgres TLS can only be disabled for a local database connection.");
    }
    return false;
  }

  if (localDatabase && !requested) return false;

  const configuredCa = env.PLAY_POINT_LIVE_DATABASE_CA_CERT
    ?.replace(/\\n/g, "\n")
    .trim();

  return configuredCa
    ? { rejectUnauthorized: true, ca: configuredCa }
    : { rejectUnauthorized: true };
}
