import { beforeEach, describe, expect, it } from "vitest";
import {
  applyLiveCrapsRoomCommand,
  clearLiveCrapsRoomStoreForTests,
  createStoredLiveCrapsRoom,
  getStoredLiveCrapsRoom,
  projectStoredLiveCrapsRoom,
} from "../lib/play-point-core/live-craps-room-store";

const HOST = "host-test";

function createStartedRoom(diceMode: "physical" | "virtual" = "physical") {
  const stored = createStoredLiveCrapsRoom({ code: "TEST", hostPlayerId: HOST, hostName: "Host", diceMode });
  applyLiveCrapsRoomCommand(stored.room.code, "start", { type: "start", actorPlayerId: HOST, nowMs: Date.now() });
  return stored.room.code;
}

function actionDeadline(code: string) {
  const deadline = getStoredLiveCrapsRoom(code).room.actionClock.deadlineMs;
  if (typeof deadline !== "number") throw new Error("Expected an active action deadline.");
  return deadline;
}

beforeEach(() => clearLiveCrapsRoomStoreForTests());

describe("Live Craps authoritative room boundaries", () => {
  it("tracks new wagers server-side and undo only removes the latest current-window wager", () => {
    const code = createStartedRoom();
    applyLiveCrapsRoomCommand(code, "pass", { type: "place-bet", actorPlayerId: HOST, kind: "pass-line", amount: 10 });
    applyLiveCrapsRoomCommand(code, "field", { type: "place-bet", actorPlayerId: HOST, kind: "field", amount: 10 });
    expect(projectStoredLiveCrapsRoom(code, HOST).myNewBetCount).toBe(2);

    applyLiveCrapsRoomCommand(code, "undo", { type: "undo-bet", actorPlayerId: HOST });
    const projected = projectStoredLiveCrapsRoom(code, HOST);
    expect(projected.myNewBetCount).toBe(1);
    expect(projected.myBets).toHaveLength(1);
    expect(projected.myBets[0].kind).toBe("pass-line");
  });

  it("clear new refunds only wagers from the current betting window", () => {
    const code = createStartedRoom();
    applyLiveCrapsRoomCommand(code, "pass", { type: "place-bet", actorPlayerId: HOST, kind: "pass-line", amount: 10 });
    applyLiveCrapsRoomCommand(code, "field", { type: "place-bet", actorPlayerId: HOST, kind: "field", amount: 25 });
    expect(projectStoredLiveCrapsRoom(code, HOST).me.chips).toBe(965);

    applyLiveCrapsRoomCommand(code, "clear", { type: "clear-new-bets", actorPlayerId: HOST });
    const projected = projectStoredLiveCrapsRoom(code, HOST);
    expect(projected.myNewBetCount).toBe(0);
    expect(projected.myBets).toHaveLength(0);
    expect(projected.me.chips).toBe(1000);
  });

  it("duplicate command ids do not double-deduct a wager", () => {
    const code = createStartedRoom();
    const command = { type: "place-bet", actorPlayerId: HOST, kind: "pass-line", amount: 10 } as const;
    applyLiveCrapsRoomCommand(code, "same-command", command);
    applyLiveCrapsRoomCommand(code, "same-command", command);
    const projected = projectStoredLiveCrapsRoom(code, HOST);
    expect(projected.myBets).toHaveLength(1);
    expect(projected.me.chips).toBe(990);
    expect(projected.myNewBetCount).toBe(1);
  });

  it("clears the undo ledger at dice out so prior working wagers cannot be refunded", () => {
    const code = createStartedRoom();
    applyLiveCrapsRoomCommand(code, "pass", { type: "place-bet", actorPlayerId: HOST, kind: "pass-line", amount: 10 });
    applyLiveCrapsRoomCommand(code, "to-dice-out", { type: "tick", nowMs: actionDeadline(code) });
    expect(projectStoredLiveCrapsRoom(code, HOST).actionClock.phase).toBe("dice-out");
    expect(projectStoredLiveCrapsRoom(code, HOST).myNewBetCount).toBe(0);

    applyLiveCrapsRoomCommand(code, "begin", { type: "begin-roll", actorPlayerId: HOST });
    expect(projectStoredLiveCrapsRoom(code, HOST).myNewBetCount).toBe(0);
    expect(() => applyLiveCrapsRoomCommand(code, "late-undo", { type: "undo-bet", actorPlayerId: HOST })).toThrow();
  });

  it("never projects a committed virtual result before reveal begins", () => {
    const code = createStartedRoom("virtual");
    applyLiveCrapsRoomCommand(code, "to-dice-out", { type: "tick", nowMs: actionDeadline(code) });
    expect(projectStoredLiveCrapsRoom(code, HOST).virtualReveal).toBeNull();

    applyLiveCrapsRoomCommand(code, "begin", { type: "begin-roll", actorPlayerId: HOST });
    const projected = projectStoredLiveCrapsRoom(code, HOST);
    expect(projected.actionClock.phase).toBe("revealing");
    expect(projected.virtualReveal).not.toBeNull();
    expect(projected.virtualReveal?.die1).toBeGreaterThanOrEqual(1);
    expect(projected.virtualReveal?.die2).toBeGreaterThanOrEqual(1);
  });

  it("settles an authoritative virtual roll once the reveal deadline is reached", () => {
    const code = createStartedRoom("virtual");
    applyLiveCrapsRoomCommand(code, "to-dice-out", { type: "tick", nowMs: actionDeadline(code) });
    applyLiveCrapsRoomCommand(code, "begin", { type: "begin-roll", actorPlayerId: HOST });
    const runtime = getStoredLiveCrapsRoom(code).runtime;
    expect(runtime?.settleAtMs).toBeTypeOf("number");
    const settleAt = runtime!.settleAtMs!;

    applyLiveCrapsRoomCommand(code, "settle-tick", { type: "tick", nowMs: settleAt });
    const projected = projectStoredLiveCrapsRoom(code, HOST);
    expect(projected.virtualReveal).toBeNull();
    expect(projected.recentRolls.length).toBe(1);
    expect(projected.actionClock.phase).toBe("post-roll-betting");
  });

  it("advances an expired betting window on read and clears its undo ledger", () => {
    const code = createStartedRoom();
    applyLiveCrapsRoomCommand(code, "pass", { type: "place-bet", actorPlayerId: HOST, kind: "pass-line", amount: 10 });
    const beforeVersion = getStoredLiveCrapsRoom(code).version;
    const deadline = actionDeadline(code);

    const projected = projectStoredLiveCrapsRoom(code, HOST, deadline);
    expect(projected.actionClock.phase).toBe("dice-out");
    expect(projected.myNewBetCount).toBe(0);
    expect(projected.version).toBe(beforeVersion + 1);
    expect(getStoredLiveCrapsRoom(code).newWagersByPlayer).toEqual({});
  });

  it("settles an expired virtual reveal on read and hides the committed result", () => {
    const code = createStartedRoom("virtual");
    applyLiveCrapsRoomCommand(code, "to-dice-out", { type: "tick", nowMs: actionDeadline(code) });
    applyLiveCrapsRoomCommand(code, "begin", { type: "begin-roll", actorPlayerId: HOST });
    const settleAt = getStoredLiveCrapsRoom(code).runtime?.settleAtMs;
    if (typeof settleAt !== "number") throw new Error("Expected virtual reveal settlement deadline.");
    const beforeVersion = getStoredLiveCrapsRoom(code).version;

    const projected = projectStoredLiveCrapsRoom(code, HOST, settleAt);
    expect(projected.virtualReveal).toBeNull();
    expect(projected.recentRolls).toHaveLength(1);
    expect(projected.actionClock.phase).toBe("post-roll-betting");
    expect(projected.version).toBe(beforeVersion + 1);
  });

  it("does not bump room version when a read causes no timed transition", () => {
    const code = createStartedRoom();
    const beforeVersion = getStoredLiveCrapsRoom(code).version;
    const deadline = actionDeadline(code);
    const projected = projectStoredLiveCrapsRoom(code, HOST, deadline - 1);

    expect(projected.actionClock.phase).toBe("post-roll-betting");
    expect(projected.version).toBe(beforeVersion);
    expect(getStoredLiveCrapsRoom(code).version).toBe(beforeVersion);
  });
});
