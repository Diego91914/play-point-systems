import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Inside Man guest access", () => {
  it("keeps Inside Man in the shared guest-room page and API model", () => {
    const source = readFileSync("proxy.ts", "utf8");
    expect(source).toContain('"inside-man"');
    expect(source).toContain("GUEST_ROOM_GAMES");
    expect(source).toContain("hasRoomCode && GUEST_ROOM_GAMES.some");
    expect(source).toContain('pathname === `/api/games/${slug}` || pathname.startsWith(`/api/games/${slug}/`)');
  });
});
