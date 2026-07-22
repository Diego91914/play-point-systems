const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const rateLimitGlobal = globalThis as typeof globalThis & {
  __playPointContactRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  rateLimitGlobal.__playPointContactRateLimits ?? new Map<string, RateLimitEntry>();

rateLimitGlobal.__playPointContactRateLimits = rateLimitStore;

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function checkContactRateLimit(identity: string, now = Date.now()): RateLimitResult {
  if (rateLimitStore.size > 5_000) {
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(key);
    }
  }

  const existing = rateLimitStore.get(identity);
  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(identity, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetContactRateLimitsForTests() {
  rateLimitStore.clear();
}

export async function verifyTurnstile(token: string, remoteIp: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { enabled: false, success: true } as const;
  if (!token) return { enabled: true, success: false } as const;

  const payload = new FormData();
  payload.set("secret", secret);
  payload.set("response", token);
  if (remoteIp !== "unknown") payload.set("remoteip", remoteIp);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: payload,
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (!response.ok) return { enabled: true, success: false } as const;
  const result = (await response.json()) as { success?: boolean };
  return { enabled: true, success: result.success === true } as const;
}
