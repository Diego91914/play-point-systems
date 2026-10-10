import { beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ active: true, open: true, insert: vi.fn() }));
vi.mock("@/app/games/trivia/venue/trivia-venue-server", () => ({
 loadTriviaVenue: async () => fixture.active ? { id: "venue", is_active: true, slug: "test", display_name: "Test" } : null,
 loadOpenTriviaVenueSession: async () => fixture.open ? { id: "session", presence_token_hash: "qr-hash" } : null,
 safeTriviaVenueTokenMatch: (token: string) => token === "valid-qr", generateTriviaVenueToken: () => "new-device-secret", hashTriviaVenueToken: () => "hashed-device-secret", seatVenuePlayerInTriviaSession: vi.fn(),
}));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from: () => ({ insert: fixture.insert }) }) }));
import { POST } from "../app/api/trivia/venue/[slug]/join/route";
const request = (name = "Guest", presenceToken = "valid-qr") => new Request("https://example.test/api/trivia/venue/test/join", { method: "POST", body: JSON.stringify({ name, presenceToken }) });
const context = { params: Promise.resolve({ slug: "test" }) };
beforeEach(() => { vi.clearAllMocks(); fixture.active = true; fixture.open = true; fixture.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: "player", name: "Guest" }, error: null }) }) }); });
it("joins without account cookies while storing only the hashed device token", async () => {
 const response = await POST(request(), context); expect(response.status).toBe(200);
 expect((await response.json()).deviceToken).toBe("new-device-secret");
 expect(fixture.insert).toHaveBeenCalledWith(expect.objectContaining({ device_token_hash: "hashed-device-secret", venue_session_id: "session" }));
});
it("requires the venue's current QR presence token", async () => { expect((await POST(request("Guest", "bad-token"), context)).status).toBe(403); expect(fixture.insert).not.toHaveBeenCalled(); });
it("rejects a closed session", async () => { fixture.open = false; expect((await POST(request(), context)).status).toBe(403); expect(fixture.insert).not.toHaveBeenCalled(); });
it("rejects inactive venues", async () => { fixture.active = false; expect((await POST(request(), context)).status).toBe(404); });
it("validates guest names on the server", async () => { expect((await POST(request(""), context)).status).toBe(400); expect(fixture.insert).not.toHaveBeenCalled(); });
