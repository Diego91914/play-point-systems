import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => ({ data: null as Record<string, unknown> | null, error: null as null | { message: string }, insert: vi.fn() }));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from: () => ({ insert: db.insert, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.data, error: db.error }) }) }) }) }) }));
import { resolvePlayAmplifiedSession, reservePlayAmplifiedSession } from "../lib/play-point-core/room-registry";
beforeEach(() => { vi.clearAllMocks(); db.data = null; db.error = null; db.insert.mockResolvedValue({ error: null }); });
it.each(["", "abc", "../../", "ABC2345"])("invalid code %s never queries a valid room", async code => { expect(await resolvePlayAmplifiedSession(code)).toBeNull(); });
it("expired entry fails gracefully", async () => { db.data = { expires_at: new Date(Date.now()-1).toISOString() }; expect(await resolvePlayAmplifiedSession("ABC234")).toBeNull(); });
it.each(["OPEN_LOBBY", "HOSTED_ROSTER"] as const)("reserves and resolves %s without changing participation", async participationModel => {
 const session = await reservePlayAmplifiedSession({ gameSku: "test", joinHref: "/destination/{code}", participationModel });
 expect(session.code).toMatch(/^[A-Z2-9]{6}$/); expect(session.joinHref).toBe(`/destination/${session.code}`);
 db.data = db.insert.mock.calls[0][0]; const resolved = await resolvePlayAmplifiedSession(session.code.toLowerCase());
 expect(resolved?.joinHref).toBe(session.joinHref); expect(resolved?.participationModel).toBe(participationModel);
});
