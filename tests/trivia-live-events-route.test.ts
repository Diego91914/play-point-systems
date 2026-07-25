import { beforeEach, describe, expect, it, vi } from "vitest";

const removeChannel = vi.fn(async () => "ok");

vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({
  getSupabaseServerClient: () => ({
    channel: () => {
      const channel = {
        on: () => channel,
        subscribe: (callback: (status: string) => void) => {
          queueMicrotask(() => callback("SUBSCRIBED"));
          return channel;
        },
      };
      return channel;
    },
    removeChannel,
  }),
}));

import { GET } from "../app/api/trivia/sessions/[sessionId]/events/route";
import { createTriviaLiveSession } from "../app/games/trivia/play/trivia-live-session";

beforeEach(() => {
  removeChannel.mockClear();
});

describe("trivia live event route", () => {
  it("rejects a stream without the host credential", async () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const response = await GET(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}/events`),
      { params: Promise.resolve({ sessionId: room.sessionId }) },
    );

    expect(response.status).toBe(401);
  });

  it("streams a sanitized initial host snapshot", async () => {
    const room = createTriviaLiveSession("bible", "mixed");
    const response = await GET(
      new Request(`https://example.com/api/trivia/sessions/${room.sessionId}/events`, {
        headers: { Authorization: `Bearer ${room.hostToken}` },
      }),
      { params: Promise.resolve({ sessionId: room.sessionId }) },
    );
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let streamed = "";

    for (let index = 0; index < 4 && !streamed.includes("event: snapshot"); index += 1) {
      const { value } = await reader.read();
      streamed += decoder.decode(value);
    }

    await reader.cancel();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(streamed).toContain("event: snapshot");
    expect(streamed).toContain(`\"sessionId\":\"${room.sessionId}\"`);
    expect(streamed).not.toContain(room.hostToken);
    expect(streamed).not.toContain("host_token_hash");
    expect(removeChannel).toHaveBeenCalledTimes(1);
  });
});
