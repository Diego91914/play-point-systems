import { describe, expect, it } from "vitest";
import { parseTriviaSseBlock } from "../app/games/trivia/play/trivia-live-stream";

describe("trivia SSE parsing", () => {
  it("parses named snapshot events", () => {
    expect(parseTriviaSseBlock('event: snapshot\ndata: {"phase":"lobby"}')).toEqual({
      event: "snapshot",
      data: '{"phase":"lobby"}',
    });
  });

  it("joins multiline event data and ignores heartbeat comments", () => {
    expect(parseTriviaSseBlock(": keepalive\nevent: message\ndata: first\ndata: second")).toEqual({
      event: "message",
      data: "first\nsecond",
    });
  });

  it("ignores blocks that contain no data", () => {
    expect(parseTriviaSseBlock(": keepalive")).toBeNull();
    expect(parseTriviaSseBlock("retry: 1500")).toBeNull();
  });
});
