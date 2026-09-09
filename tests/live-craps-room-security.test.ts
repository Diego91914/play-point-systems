import { beforeEach, describe, expect, it } from "vitest";
import {
  applyLiveCrapsRoomCommand,
  clearLiveCrapsRoomStoreForTests,
  createStoredLiveCrapsRoom,
  getStoredLiveCrapsRoom,
  projectStoredLiveCrapsRoom,
} from "../lib/play-point-core/live-craps-room-store";

const HOST="host-1";
const CODE="CRAP01";

function createStartedRoom(){
  createStoredLiveCrapsRoom({code:CODE,hostPlayerId:HOST,hostName:"Host",diceMode:"virtual"});
  applyLiveCrapsRoomCommand(CODE,"start-1",{type:"start",actorPlayerId:HOST,nowMs:1_000});
}

function chips(){return projectStoredLiveCrapsRoom(CODE,HOST).me.chips;}

describe("Live Craps server-owned betting window",()=>{
  beforeEach(()=>clearLiveCrapsRoomStoreForTests());

  it("tracks new wagers server-side and undo removes only the newest current-window wager",()=>{
    createStartedRoom();
    const initial=chips();
    applyLiveCrapsRoomCommand(CODE,"bet-1",{type:"place-bet",actorPlayerId:HOST,kind:"pass-line",amount:10});
    applyLiveCrapsRoomCommand(CODE,"bet-2",{type:"place-bet",actorPlayerId:HOST,kind:"field",amount:10});
    expect(projectStoredLiveCrapsRoom(CODE,HOST).myNewBetCount).toBe(2);
    expect(chips()).toBe(initial-20);
    applyLiveCrapsRoomCommand(CODE,"undo-1",{type:"undo-bet",actorPlayerId:HOST});
    const projected=projectStoredLiveCrapsRoom(CODE,HOST);
    expect(projected.myNewBetCount).toBe(1);
    expect(projected.myBets).toHaveLength(1);
    expect(projected.myBets[0].kind).toBe("pass-line");
    expect(chips()).toBe(initial-10);
  });

  it("clear new refunds only server-tracked wagers and duplicate command ids do not double-deduct",()=>{
    createStartedRoom();
    const initial=chips();
    const command={type:"place-bet" as const,actorPlayerId:HOST,kind:"field" as const,amount:10};
    applyLiveCrapsRoomCommand(CODE,"same-command",command);
    applyLiveCrapsRoomCommand(CODE,"same-command",command);
    expect(projectStoredLiveCrapsRoom(CODE,HOST).myNewBetCount).toBe(1);
    expect(chips()).toBe(initial-10);
    applyLiveCrapsRoomCommand(CODE,"clear-1",{type:"clear-new-bets",actorPlayerId:HOST});
    expect(projectStoredLiveCrapsRoom(CODE,HOST).myNewBetCount).toBe(0);
    expect(chips()).toBe(initial);
  });

  it("clears the undo ledger at dice out and rejects betting while dice are out",()=>{
    createStartedRoom();
    applyLiveCrapsRoomCommand(CODE,"bet-1",{type:"place-bet",actorPlayerId:HOST,kind:"pass-line",amount:10});
    applyLiveCrapsRoomCommand(CODE,"dice-out",{type:"tick",nowMs:16_000});
    expect(getStoredLiveCrapsRoom(CODE).room.actionClock.phase).toBe("dice-out");
    expect(()=>applyLiveCrapsRoomCommand(CODE,"late-bet",{type:"place-bet",actorPlayerId:HOST,kind:"field",amount:10})).toThrow(/Betting is closed/);
  });
});
