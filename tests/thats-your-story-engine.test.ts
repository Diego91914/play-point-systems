import { describe, expect, it } from "vitest";
import {
  initialStoryState,
  applyStoryAction,
  projectStory,
  type StoryState,
} from "../lib/play-point-core/thats-your-story-engine";
import { STORY_PROMPTS } from "../lib/play-point-core/thats-your-story-prompts";

const player = (id: string, seat: number) => ({
  id,
  name: id,
  seat,
  score: 0,
  tokenHash: "private-" + id,
});
function lobby() {
  const s = initialStoryState("ABC234", "private-account", player("a", 0));
  s.players.push(player("b", 1), player("c", 2));
  return s;
}
function action(
  s: StoryState,
  id: string,
  kind: string,
  payload: Record<string, unknown> = {},
) {
  applyStoryAction(s, id, kind, { roundId: s.roundId, ...payload });
}
function writing() {
  const s = lobby();
  action(s, "a", "start");
  return s;
}
function voting() {
  const s = writing();
  for (const p of s.players)
    action(s, p.id, "submit", { text: "Story " + p.id });
  return s;
}
function entry(s: StoryState, id: string) {
  return s.entries.find((e) => e.authorId === id)!.id;
}
describe("That's Your Story game engine", () => {
  it("ships 125 unique scenarios for each edition", () => {
    for (const list of Object.values(STORY_PROMPTS)) {
      expect(list.length).toBe(125);
      expect(new Set(list).size).toBe(list.length);
    }
  });
  it("requires a host and at least three players, with host-only settings", () => {
    const s = lobby();
    expect(() => action(s, "b", "start")).toThrow();
    expect(() =>
      action(s, "b", "settings", { edition: "christmas", maxRounds: 15 }),
    ).toThrow();
    s.players.pop();
    expect(() => action(s, "a", "start")).toThrow();
    s.players.push(player("c", 2));
    action(s, "a", "settings", { edition: "christmas", maxRounds: 15 });
    action(s, "a", "start");
    expect(s.phase).toBe("writing");
    expect(s.promptOrder).toHaveLength(15);
    expect(new Set(s.promptOrder).size).toBe(15);
  });
  it("keeps writing secret, including from the host, until all stories are submitted", () => {
    const s = writing();
    action(s, "b", "submit", { text: "secret story" });
    expect(projectStory(s, "a").entries).toEqual([]);
    expect(projectStory(s, "a").ownStory).toBeNull();
    expect(projectStory(s, "b").ownStory).toBe("secret story");
    expect(JSON.stringify(projectStory(s, "a"))).not.toContain("secret story");
    expect(JSON.stringify(projectStory(s, "a"))).not.toContain(
      "private-account",
    );
    expect(JSON.stringify(projectStory(s, "a"))).not.toContain("private-b");
    expect(() => action(s, "b", "submit", { text: "changed" })).toThrow();
    action(s, "b", "submit", { text: "secret story" });
    expect(s.entries).toHaveLength(1);
    expect(() => action(s, "a", "submit", { text: " ".repeat(10) })).toThrow();
    expect(() => action(s, "a", "submit", { text: "x".repeat(241) })).toThrow();
    action(s, "a", "submit", { text: "A" });
    action(s, "c", "submit", { text: "C" });
    expect(s.phase).toBe("voting");
  });
  it("reveals anonymous choices only; disallows self votes and duplicate different votes", () => {
    const s = voting(),
      view = projectStory(s, "b");
    expect(view.entries).toHaveLength(3);
    expect(view.entries.filter((e) => e.own)).toHaveLength(1);
    for (const e of view.entries) {
      expect(e).not.toHaveProperty("authorId");
      expect(e).not.toHaveProperty("points");
    }
    expect(() => action(s, "a", "vote", { entryId: entry(s, "a") })).toThrow();
    expect(() => action(s, "a", "vote", { entryId: "fake" })).toThrow();
    action(s, "a", "vote", { entryId: entry(s, "b") });
    action(s, "a", "vote", { entryId: entry(s, "b") });
    expect(() => action(s, "a", "vote", { entryId: entry(s, "c") })).toThrow();
    expect(projectStory(s, "b").ownVote).toBeNull();
    expect(s.players.every((p) => p.score === 0)).toBe(true);
  });
  it("scores once, reveals authors, and rejects stale actions after next round", () => {
    const s = voting();
    const old = s.roundId;
    action(s, "a", "vote", { entryId: entry(s, "b") });
    action(s, "b", "vote", { entryId: entry(s, "a") });
    action(s, "c", "vote", { entryId: entry(s, "b") });
    expect(s.phase).toBe("reveal");
    expect(s.players.map((p) => p.score)).toEqual([1, 2, 0]);
    expect(projectStory(s, "a").entries.every((e) => e.authorId)).toBe(true);
    action(s, "c", "vote", { entryId: entry(s, "b") });
    expect(s.players.map((p) => p.score)).toEqual([1, 2, 0]);
    expect(() => action(s, "a", "finish-voting")).toThrow();
    expect(() => action(s, "b", "next")).toThrow();
    action(s, "a", "next");
    expect(s.phase).toBe("writing");
    expect(s.entries).toEqual([]);
    expect(s.roundId).not.toBe(old);
    expect(() =>
      action(s, "a", "submit", { text: "stale", roundId: old }),
    ).toThrow();
  });
  it("can progress past disconnected players without assigning phantom votes", () => {
    const s = writing();
    action(s, "a", "submit", { text: "A" });
    expect(() => action(s, "a", "open-voting")).toThrow();
    action(s, "b", "submit", { text: "B" });
    expect(() => action(s, "b", "open-voting")).toThrow();
    action(s, "a", "open-voting");
    action(s, "a", "vote", { entryId: entry(s, "b") });
    action(s, "a", "finish-voting");
    expect(s.players.map((p) => p.score)).toEqual([0, 1, 0]);
    action(s, "a", "next");
    action(s, "a", "skip");
    expect(s.phase).toBe("reveal");
    expect(s.players.map((p) => p.score)).toEqual([0, 1, 0]);
  });
  it("finishes after chosen rounds and restarts cleanly with same roster", () => {
    const s = writing();
    for (let i = 0; i < 5; i++) {
      action(s, "a", "skip");
      action(s, "a", "next");
    }
    expect(s.phase).toBe("finished");
    action(s, "a", "restart");
    expect(s.phase).toBe("lobby");
    expect(s.players).toHaveLength(3);
    expect(s.players.every((p) => p.score === 0)).toBe(true);
    s.playAmplifiedEndedAt = new Date().toISOString();
    expect(() => action(s, "a", "start")).toThrow();
  });
});
