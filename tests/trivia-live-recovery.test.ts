import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET as getHostSnapshot } from "../app/api/trivia/sessions/[sessionId]/route";
import { GET as getPlayerSnapshot } from "../app/api/trivia/sessions/[sessionId]/players/[playerId]/route";
import { POST as createRoom } from "../app/api/trivia/sessions/route";
import { POST as joinRoom } from "../app/api/trivia/rooms/join/route";
import {
  getTriviaHostCookieName,
  getTriviaPlayerCookieName,
  readTriviaLiveHostToken,
  readTriviaLivePlayerToken,
  setTriviaLiveHostCookie,
  setTriviaLivePlayerCookie,
} from "../app/games/trivia/play/trivia-live-cookie";
import {
  createTriviaLiveSession,
  joinTriviaLiveSession,
} from "../app/games/trivia/play/trivia-live-session";

afterEach(() => vi.unstubAllEnvs());

describe("trivia live recovery credentials", () => {
  it("sets API-scoped HttpOnly cookies and marks them Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = NextResponse.json({ ok: true });

    setTriviaLiveHostCookie(response, "session-id", "host-token");
    setTriviaLivePlayerCookie(response, "player-id", "player-token");

    const cookies = response.headers.getSetCookie().join("\n");
    expect(cookies).toContain("ppl_trivia_host_sessionid=host-token");
    expect(cookies).toContain("ppl_trivia_player_playerid=player-token");
    expect(cookies).toContain("Path=/api/trivia");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("Secure");
    expect(cookies).toContain("SameSite=lax");
    expect(cookies).toContain("Max-Age=21600");
  });

  it("reads role-specific cookies while preserving bearer-token compatibility", () => {
    const sessionId = "session-id";
    const playerId = "player-id";
    const cookieRequest = new Request("https://example.com/api/trivia", {
      headers: {
        Cookie: `${getTriviaHostCookieName(sessionId)}=host-cookie; ${getTriviaPlayerCookieName(playerId)}=player-cookie`,
      },
    });

    expect(readTriviaLiveHostToken(cookieRequest, sessionId)).toBe("host-cookie");
    expect(readTriviaLivePlayerToken(cookieRequest, playerId)).toBe("player-cookie");

    const bearerRequest = new Request("https://example.com/api/trivia", {
      headers: {
        Authorization: "Bearer legacy-token",
        Cookie: `${getTriviaHostCookieName(sessionId)}=host-cookie`,
      },
    });
    expect(readTriviaLiveHostToken(bearerRequest, sessionId)).toBe("legacy-token");
  });

  it("keeps newly issued host and player tokens out of response bodies", async () => {
    const createResponse = await createRoom(new Request("https://example.com/api/trivia/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "bible",
        difficultyFilter: "mixed",
        pacingMode: "standard",
        gameMode: "individual",
        teamCount: 2,
      }),
    }));
    const room = await createResponse.json() as { sessionId: string; roomCode: string; hostToken?: string };

    expect(createResponse.status).toBe(200);
    expect(room.hostToken).toBeUndefined();
    expect(createResponse.headers.get("set-cookie")).toContain(getTriviaHostCookieName(room.sessionId));

    const joinResponse = await joinRoom(new Request("https://example.com/api/trivia/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: room.roomCode, playerName: "Miriam" }),
    }));
    const joined = await joinResponse.json() as { player: { id: string }; playerToken?: string };

    expect(joinResponse.status).toBe(200);
    expect(joined.playerToken).toBeUndefined();
    expect(joinResponse.headers.get("set-cookie")).toContain(getTriviaPlayerCookieName(joined.player.id));
  });

  it("restores host and player snapshots using cookies alone", async () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const joined = joinTriviaLiveSession(room.roomCode, "Olivia");

    const hostResponse = await getHostSnapshot(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}`, {
        headers: { Cookie: `${getTriviaHostCookieName(room.sessionId)}=${room.hostToken}` },
      }),
      { params: Promise.resolve({ sessionId: room.sessionId }) },
    );
    const playerResponse = await getPlayerSnapshot(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}/players/${joined.playerId}`, {
        headers: { Cookie: `${getTriviaPlayerCookieName(joined.playerId)}=${joined.playerToken}` },
      }),
      { params: Promise.resolve({ sessionId: room.sessionId, playerId: joined.playerId }) },
    );

    expect(hostResponse.status).toBe(200);
    expect(playerResponse.status).toBe(200);
    expect((await hostResponse.json()).sessionId).toBe(room.sessionId);
    expect((await playerResponse.json()).player.id).toBe(joined.playerId);
    expect(hostResponse.headers.get("set-cookie")).toContain(getTriviaHostCookieName(room.sessionId));
    expect(playerResponse.headers.get("set-cookie")).toContain(getTriviaPlayerCookieName(joined.playerId));
  });

  it("rejects a cookie belonging to a different host or player", async () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const joined = joinTriviaLiveSession(room.roomCode, "Noah");

    const hostResponse = await getHostSnapshot(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}`, {
        headers: { Cookie: `${getTriviaHostCookieName("another-session")}=${room.hostToken}` },
      }),
      { params: Promise.resolve({ sessionId: room.sessionId }) },
    );
    const playerResponse = await getPlayerSnapshot(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}/players/${joined.playerId}`, {
        headers: { Cookie: `${getTriviaPlayerCookieName("another-player")}=${joined.playerToken}` },
      }),
      { params: Promise.resolve({ sessionId: room.sessionId, playerId: joined.playerId }) },
    );

    expect(hostResponse.status).toBe(401);
    expect(playerResponse.status).toBe(401);
  });
});
