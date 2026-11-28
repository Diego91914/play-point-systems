import { describe, expect, it } from "vitest";
import {
  initialStoryState,
  applyStoryAction,
  projectStory,
  type StoryState,
} from "../lib/play-point-core/thats-your-story-engine";
import { STORY_PROMPTS } from "../lib/play-point-core/thats-your-story-prompts";
import { STORY_CHOICES, storyChoicesFor } from "../lib/play-point-core/thats-your-story-choices";

const player = (id: string, seat: number) => ({
  id, name: "Player " + id, seat, score: 0, tokenHash: "private-" + id,
});
function lobby(count = 3) {
  const state = initialStoryState("ABC234", "private-account", player("p0", 0));
  for (let seat = 1; seat < count; seat++) state.players.push(player("p" + seat, seat));
  return state;
}
function act(state: StoryState, id: string, kind: string, payload: Record<string, unknown> = {}) {
  return applyStoryAction(state, id, kind, { roundId: state.roundId, ...payload });
}
function writing(count = 3) {
  const state = lobby(count);
  act(state, "p0", "start");
  return state;
}
function submit(state: StoryState, id: string, text: string) {
  act(state, id, "submit", { text });
  return state.entries.find((entry) => entry.authorIds.includes(id))!;
}
function vote(state: StoryState, id: string, entryId: string) {
  act(state, id, "vote", { entryId });
}
function choice(state: StoryState, index = 0) {
  return storyChoicesFor(state.edition, state.promptOrder[state.round])[index];
}
describe("That's Your Story Phase 1 selection and Phase 2 voting", () => {
  it("preserves all 125 scenarios and three distinct choices per scenario", () => {
    for (const edition of ["family", "christmas"] as const) {
      expect(STORY_PROMPTS[edition]).toHaveLength(125);
      expect(new Set(STORY_PROMPTS[edition]).size).toBe(125);
      expect(STORY_CHOICES[edition]).toHaveLength(125);
      for (const choices of STORY_CHOICES[edition]) {
        expect(choices).toHaveLength(3);
        expect(new Set(choices).size).toBe(3);
        expect(choices.every((text) => text.trim() === text && text.length > 0 && text.length <= 240)).toBe(true);
      }
    }
  });

  it("groups case and whitespace variants while keeping each submission and author", () => {
    const state = writing(3);
    const original = submit(state, "p0", "A very silly explanation");
    submit(state, "p1", "  a VERY   silly explanation  ");
    submit(state, "p2", "Another explanation");
    expect(state.submissions).toHaveLength(3);
    expect(state.entries).toHaveLength(2);
    expect(state.entries.find((entry) => entry.id === original.id)?.authorIds).toEqual(["p0", "p1"]);
    expect(state.entries.find((entry) => entry.id === original.id)?.initialVotes).toBe(2);
    expect(state.phase).toBe("voting");
  });

  it("keeps Phase 1 answers and all vote totals private through Phase 2", () => {
    const state = writing(3);
    const first = submit(state, "p0", "Secret answer");
    submit(state, "p1", "Second answer");
    submit(state, "p2", "Third answer");
    const viewer = projectStory(state, "p0");
    expect(viewer.entries).toHaveLength(3);
    expect(viewer.entries.find((entry) => entry.ownInitial)?.id).toBe(first.id);
    expect(viewer.entries.every((entry) => !("initialVotes" in entry))).toBe(true);
    expect(viewer.entries.every((entry) => !("authors" in entry))).toBe(true);
    expect(viewer.voteProgress).toBe("1/2");
    expect(viewer.entries.every((entry) => !("authorIds" in entry))).toBe(true);
    vote(state, "p0", state.entries.find((entry) => entry.id !== first.id)!.id);
    expect(projectStory(state, "p0").voteProgress).toBe("2/2");
    expect(projectStory(state, "p0").ownVote).not.toBe(first.id);
    expect(state.players.every((candidate) => candidate.score === 0)).toBe(true);
    expect(() => vote(state, "p0", first.id)).toThrow();
  });

  it("awards both votes equally and awards an outright original author the bonus", () => {
    const state = writing(6);
    const a = choice(state, 0), b = choice(state, 1), c = choice(state, 2);
    const authors = [
      submit(state, "p0", a), submit(state, "p1", a), submit(state, "p2", a),
      submit(state, "p3", b), submit(state, "p4", c), submit(state, "p5", "I was testing a new recipe for invisible soup."),
    ];
    const entryA = state.entries.find((entry) => entry.text === a)!;
    const entryB = state.entries.find((entry) => entry.text === b)!;
    const entryC = state.entries.find((entry) => entry.text === c)!;
    const entryD = state.entries.find((entry) => entry.text === "I was testing a new recipe for invisible soup.")!;
    expect(authors[5].originalAuthorIds).toContain("p5");
    vote(state, "p0", entryD.id);
    vote(state, "p1", entryD.id);
    vote(state, "p2", entryD.id);
    vote(state, "p3", entryA.id);
    vote(state, "p4", entryD.id);
    vote(state, "p5", entryB.id);
    expect(state.phase).toBe("reveal");
    expect([entryA.totalVotes, entryB.totalVotes, entryC.totalVotes, entryD.totalVotes]).toEqual([4, 2, 1, 5]);
    expect(state.roundPoints).toEqual({ p0: 4, p1: 4, p2: 4, p3: 2, p4: 1, p5: 6 });
    expect(state.players.map((candidate) => candidate.score)).toEqual([4, 4, 4, 2, 1, 6]);
    const results = projectStory(state, "p0").entries.find((entry) => entry.id === entryD.id)!;
    expect(results).toMatchObject({ initialVotes: 1, additionalVotes: 4, totalVotes: 5, originalAuthors: ["Player p5"], bonusEarned: true });
    expect(projectStory(state, "p3").players.find((candidate) => candidate.id === "p3")?.roundPoints).toBe(2);
  });

  it("awards no author bonus when original answers tie for first", () => {
    const state = writing(4);
    const answerA = submit(state, "p0", "One original explanation");
    const answerD = submit(state, "p1", "Another original explanation");
    submit(state, "p2", "Third original explanation");
    submit(state, "p3", "Fourth original explanation");
    vote(state, "p0", answerD.id);
    vote(state, "p1", answerA.id);
    vote(state, "p2", answerA.id);
    vote(state, "p3", answerD.id);
    expect(answerA.totalVotes).toBe(3);
    expect(answerD.totalVotes).toBe(3);
    expect(answerA.bonusEarned).toBe(false);
    expect(answerD.bonusEarned).toBe(false);
    expect(state.roundPoints).toEqual({ p0: 3, p1: 3, p2: 1, p3: 1 });
  });

  it("gives every independently qualifying author the grouped answer bonus", () => {
    const state = writing(4);
    const answer = submit(state, "p0", "The raccoon demanded a receipt");
    submit(state, "p1", "  THE RACCOON   DEMANDED A RECEIPT  ");
    submit(state, "p2", "A different answer");
    submit(state, "p3", "One more different answer");
    vote(state, "p0", state.entries.find((entry) => entry.id !== answer.id)!.id);
    vote(state, "p1", state.entries.find((entry) => entry.id !== answer.id)!.id);
    vote(state, "p2", answer.id);
    vote(state, "p3", answer.id);
    expect(answer.totalVotes).toBe(4);
    expect(answer.originalAuthorIds).toEqual(["p0", "p1"]);
    expect(state.roundPoints.p0).toBe(5);
    expect(state.roundPoints.p1).toBe(5);
  });

  it("rejects formatting edits to provided answers as originals", () => {
    const state = writing(3);
    const provided = choice(state);
    const answer = submit(state, "p0", provided.toUpperCase().replace(/ /g, "   "));
    submit(state, "p1", choice(state, 1));
    submit(state, "p2", "My own distinct answer");
    expect(answer.originalAuthorIds).toEqual([]);
    expect(state.entries).toHaveLength(3);
  });

  it("bypasses Phase 2 for one unique answer and gives unanimous submitters the shared total without bonus", () => {
    const state = writing(3);
    const answer = "The same original answer from everyone";
    submit(state, "p0", answer);
    submit(state, "p1", " THE SAME ORIGINAL ANSWER FROM EVERYONE ");
    submit(state, "p2", answer.toUpperCase());
    expect(state.phase).toBe("reveal");
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].totalVotes).toBe(3);
    expect(state.entries[0].bonusEarned).toBe(false);
    expect(state.roundPoints).toEqual({ p0: 3, p1: 3, p2: 3 });
    expect(state.votes).toEqual({});
  });

  it("bypasses voting for one answer when the host advances inactive players", () => {
    const state = writing(3);
    submit(state, "p0", "One submitted answer");
    act(state, "p0", "open-voting");
    expect(state.phase).toBe("reveal");
    expect(state.roundPoints).toEqual({ p0: 2 });
  });

  it("locks the first vote, disallows duplicate scoring, and lets the host close partial voting", () => {
    const state = writing(4);
    const answers = ["A custom answer", "B custom answer", "C custom answer", "D custom answer"];
    answers.forEach((answer, index) => submit(state, "p" + index, answer));
    const first = state.entries.find((entry) => entry.text === answers[0])!;
    const firstAuthor = first.authorIds[0];
    const second = state.entries.find((entry) => entry.text === answers[1])!;
    expect(applyStoryAction(state, firstAuthor, "submit", { roundId: state.roundId, text: answers[0] })).toBe(false);
    vote(state, firstAuthor, second.id);
    expect(applyStoryAction(state, firstAuthor, "vote", { roundId: state.roundId, entryId: second.id })).toBe(false);
    expect(() => vote(state, firstAuthor, first.id)).toThrow();
    act(state, "p0", "finish-voting");
    expect(state.phase).toBe("reveal");
    expect(state.roundPoints.p0).toBe(1);
    expect(state.roundPoints.p1).toBe(3);
    expect(state.players.reduce((total, candidate) => total + candidate.score, 0)).toBe(6);
  });

  it("upgrades saved rooms using the earlier per-player answer and vote format", () => {
    const state = writing(3);
    state.phase = "reveal";
    delete state.scoringVersion;
    state.entries = [
      { id: "old-a", authorId: "p0", text: "Original answer" },
      { id: "old-b", authorId: "p1", text: "Other answer" },
      { id: "old-c", authorId: "p2", text: "Third answer" },
    ] as unknown as StoryState["entries"];
    state.votes = { p0: "old-b", p1: "old-a", p2: "old-a" };
    state.roundPoints = { p0: 2, p1: 1, p2: 0 };
    state.players[0].score = 2;
    state.players[1].score = 1;
    const view = projectStory(state, "p0");
    expect(state.scoringVersion).toBe(2);
    expect(state.submissions).toHaveLength(3);
    expect(state.entries).toHaveLength(3);
    expect(state.entries.find((entry) => entry.text === "Original answer")?.totalVotes).toBe(3);
    expect(state.roundPoints).toEqual({ p0: 4, p1: 2, p2: 1 });
    expect(state.players.map((candidate) => candidate.score)).toEqual([4, 2, 1]);
    expect(view.entries.find((entry) => entry.text === "Original answer")?.authors).toEqual(["Player p0"]);
  });

  it("keeps the host controls, round progression, skipped rounds, and tied match winners", () => {
    const state = writing(3);
    submit(state, "p0", "A");
    submit(state, "p1", "B");
    act(state, "p0", "open-voting");
    act(state, "p0", "skip");
    expect(state.phase).toBe("reveal");
    expect(state.players.every((candidate) => candidate.score === 0)).toBe(true);
    act(state, "p0", "next");
    expect(state.phase).toBe("writing");
    state.players[1].score = 2;
    state.players[2].score = 2;
    state.phase = "finished";
    const final = projectStory(state, "p0");
    expect(final.players.filter((candidate) => candidate.score === 2)).toHaveLength(2);
  });
});
