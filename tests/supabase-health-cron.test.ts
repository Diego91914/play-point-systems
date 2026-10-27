import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const limit = vi.fn();
  const select = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ select }));
  const createClient = vi.fn(() => ({ from }));
  return { limit, select, from, createClient };
});

vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));

import { GET } from "../app/api/cron/supabase-health/route";

const URL = "https://qdsyxcjmrsxetjxeuojk.supabase.co";
const KEYS = [
  "CRON_SECRET",
  "PLAY_POINT_LIVE_SUPABASE_URL",
  "PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY",
] as const;
const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function request(token = "correct-token") {
  return new Request("http://localhost/api/cron/supabase-health", {
    headers: { authorization: `Bearer ${token}` },
  });
}

beforeEach(() => {
  process.env.CRON_SECRET = "correct-token";
  process.env.PLAY_POINT_LIVE_SUPABASE_URL = URL;
  process.env.PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
  mocks.limit.mockResolvedValue({ data: [], error: null });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("Play Amplified scheduled Supabase check", () => {
  it("blocks unauthenticated requests without querying the database", async () => {
    const response = await GET(request("wrong-token"));
    expect(response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("fails closed when the cron secret is missing", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("performs only a limited database read and prevents caching", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.createClient).toHaveBeenCalledWith(URL, "server-only-test-key", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect(mocks.from).toHaveBeenCalledWith("ppl_room_registry");
    expect(mocks.select).toHaveBeenCalledWith("code");
    expect(mocks.limit).toHaveBeenCalledWith(1);
  });

  it("refuses a different Supabase project", async () => {
    process.env.PLAY_POINT_LIVE_SUPABASE_URL = "https://qdgiqfmslgbhwavfygmd.supabase.co";
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("reports missing credentials as unavailable without issuing a read", async () => {
    delete process.env.PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY;
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("reports database errors without exposing a record or credentials", async () => {
    mocks.limit.mockResolvedValue({ data: null, error: { code: "PGRST500" } });
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
  });
});
