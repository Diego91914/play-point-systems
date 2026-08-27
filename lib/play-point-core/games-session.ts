export const GAMES_SESSION_COOKIE = "pps_games_session";
export const GAMES_SESSION_TTL_SECONDS = 60 * 60 * 24;

const GAMES_SESSION_VERSION = "v1";

export type GamesSessionRole = "founder" | "member";

export type GamesSessionClaims = {
  sub: string;
  email: string;
  role: GamesSessionRole;
  entitlements: string[];
  iat: number;
  exp: number;
};

type GamesSessionInput = Pick<
  GamesSessionClaims,
  "sub" | "email" | "role" | "entitlements"
>;

function getGamesSessionSecret(): string {
  const secret =
    process.env.PLAY_POINT_GAMES_SESSION_SECRET ??
    process.env.PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing PLAY_POINT_GAMES_SESSION_SECRET or a server-side Supabase service key."
    );
  }

  return secret;
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    bytesToArrayBuffer(utf8(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createGamesSessionToken(
  input: GamesSessionInput,
  options?: { ttlSeconds?: number; secret?: string; nowSeconds?: number }
): Promise<string> {
  const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttlSeconds = options?.ttlSeconds ?? GAMES_SESSION_TTL_SECONDS;
  const claims: GamesSessionClaims = {
    ...input,
    entitlements: Array.from(new Set(input.entitlements)).sort(),
    iat: now,
    exp: now + ttlSeconds,
  };

  const payload = bytesToBase64Url(utf8(JSON.stringify(claims)));
  const signedValue = `${GAMES_SESSION_VERSION}.${payload}`;
  const key = await importHmacKey(options?.secret ?? getGamesSessionSecret());
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      bytesToArrayBuffer(utf8(signedValue))
    )
  );

  return `${signedValue}.${bytesToBase64Url(signature)}`;
}

export async function verifyGamesSessionToken(
  token: string | null | undefined,
  options?: { secret?: string; nowSeconds?: number }
): Promise<GamesSessionClaims | null> {
  if (!token) return null;

  try {
    const [version, payload, signatureValue, ...rest] = token.split(".");
    if (
      version !== GAMES_SESSION_VERSION ||
      !payload ||
      !signatureValue ||
      rest.length > 0
    ) {
      return null;
    }

    const signedValue = `${version}.${payload}`;
    const key = await importHmacKey(options?.secret ?? getGamesSessionSecret());
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      bytesToArrayBuffer(base64UrlToBytes(signatureValue)),
      bytesToArrayBuffer(utf8(signedValue))
    );
    if (!validSignature) return null;

    const claims = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload))
    ) as Partial<GamesSessionClaims>;
    const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);

    if (
      typeof claims.sub !== "string" ||
      !claims.sub ||
      typeof claims.email !== "string" ||
      !claims.email ||
      (claims.role !== "founder" && claims.role !== "member") ||
      !Array.isArray(claims.entitlements) ||
      !claims.entitlements.every((sku) => typeof sku === "string") ||
      !Number.isInteger(claims.iat) ||
      !Number.isInteger(claims.exp) ||
      (claims.exp as number) <= now
    ) {
      return null;
    }

    return claims as GamesSessionClaims;
  } catch {
    return null;
  }
}

export function gamesSessionOwns(
  claims: GamesSessionClaims,
  gameSku: string
): boolean {
  return (
    claims.role === "founder" ||
    claims.entitlements.includes("*") ||
    claims.entitlements.includes(gameSku)
  );
}
