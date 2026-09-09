import { describe, expect, it } from "vitest";
import {
  decideLiveCrapsWorking,
  defaultLiveCrapsComeOutWorking,
  setLiveCrapsWorkingOverride,
  type LiveCrapsWorkingContract,
} from "../lib/play-point-core/live-craps-working";

const contract = (kind: LiveCrapsWorkingContract["kind"]): LiveCrapsWorkingContract => ({
  betId: `bet-${kind}`,
  playerId: "a",
  kind,
  playerOverride: "default",
});

describe("Live Craps working/off controls", () => {
  it("uses standard come-out defaults", () => {
    expect(defaultLiveCrapsComeOutWorking("come-odds")).toBe(false);
    expect(defaultLiveCrapsComeOutWorking("place")).toBe(false);
    expect(defaultLiveCrapsComeOutWorking("buy")).toBe(false);
    expect(defaultLiveCrapsComeOutWorking("dont-come-odds")).toBe(true);
    expect(defaultLiveCrapsComeOutWorking("lay")).toBe(true);
    expect(defaultLiveCrapsComeOutWorking("hardway")).toBe(true);
  });

  it("works supported contracts normally while a table point is on", () => {
    for (const kind of ["come-odds", "dont-come-odds", "place", "buy", "lay", "hardway"] as const) {
      expect(decideLiveCrapsWorking({ contract: contract(kind), tablePoint: 6 }).working).toBe(true);
    }
  });

  it("lets the owner call an otherwise-off wager working", () => {
    const original = contract("come-odds");
    const changed = setLiveCrapsWorkingOverride({ contracts: [original], playerId: "a", betId: original.betId, working: true });
    expect(decideLiveCrapsWorking({ contract: changed[0], tablePoint: null })).toMatchObject({ working: true, reason: "player-called-on" });
  });

  it("lets the owner call an otherwise-on wager off", () => {
    const original = contract("lay");
    const changed = setLiveCrapsWorkingOverride({ contracts: [original], playerId: "a", betId: original.betId, working: false });
    expect(decideLiveCrapsWorking({ contract: changed[0], tablePoint: null })).toMatchObject({ working: false, reason: "player-called-off" });
  });

  it("restores the table default", () => {
    const original = { ...contract("place"), playerOverride: "on" as const };
    const changed = setLiveCrapsWorkingOverride({ contracts: [original], playerId: "a", betId: original.betId, working: "default" });
    expect(decideLiveCrapsWorking({ contract: changed[0], tablePoint: null }).working).toBe(false);
  });

  it("prevents another player from changing the wager", () => {
    const original = contract("hardway");
    expect(() => setLiveCrapsWorkingOverride({ contracts: [original], playerId: "b", betId: original.betId, working: false })).toThrow(/owner/i);
  });
});
