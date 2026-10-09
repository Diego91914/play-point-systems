import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
type Row = { code: string; version: number; state: { status: string; players: Array<{ id: string; name: string; tokenHash: string; seat: number }>; [key: string]: unknown } };
const db = vi.hoisted(() => ({ row: null as Row | null }));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ from: () => {
 const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: structuredClone(db.row), error: null }), insert: async (row: Row) => { db.row = structuredClone(row); return { error: null }; }, update: (update: Record<string, unknown>) => { db.row = { ...db.row, ...structuredClone(update) } as Row; return query; } }; return query;
} }) }));
import { createMysteryRoom, joinMysteryRoom, actMysteryRoom } from "../lib/play-point-core/mystery-server-v2";
beforeEach(() => { db.row = null; });
it("host creates, guest joins without account, guest cannot start or restart", async () => {
 const host = await createMysteryRoom("Host", "founder-account");
 const guest = await joinMysteryRoom(host.code, "Guest");
 expect(guest.playerId).not.toBe(host.playerId); expect(guest.token).toBeTruthy();
 await expect(actMysteryRoom(host.code, guest.playerId, guest.token, "start")).rejects.toThrow(/host/i);
 await expect(actMysteryRoom(host.code, guest.playerId, guest.token, "restart")).rejects.toThrow(/host/i);
 await expect(actMysteryRoom(host.code, host.playerId, guest.token, "start")).rejects.toThrow(/Invalid player/);
});
it("rejects nonexistent, invalid, full and active rooms and invalid names", async () => {
 await expect(joinMysteryRoom("ABC234", "Guest")).rejects.toThrow(/not found/);
 await expect(joinMysteryRoom("bad", "Guest")).rejects.toThrow(/valid/);
 const host = await createMysteryRoom("Host", "founder-account");
 await expect(joinMysteryRoom(host.code, "")).rejects.toThrow(/name/);
 db.row!.state.status = "interrogation";
 await expect(joinMysteryRoom(host.code, "Guest")).rejects.toThrow(/begun/);
 db.row!.state.status = "lobby"; db.row!.state.players = Array.from({length: 8}, () => db.row!.state.players[0]);
 await expect(joinMysteryRoom(host.code, "Guest")).rejects.toThrow(/full/);
});
