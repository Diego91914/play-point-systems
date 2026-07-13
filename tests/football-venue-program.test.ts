import { describe, expect, it } from "vitest";
import { buildFootballVenueProgramState } from "../lib/play-point-core/football-venue-program";
import type { PlayPointTrigger } from "../lib/play-point-core/runtime-contracts";

function makeTrigger(
  overrides: Partial<PlayPointTrigger> & {
    id: string;
    occurredAt: string;
    payload?: Record<string, unknown>;
  },
): PlayPointTrigger {
  return {
    id: overrides.id,
    eventId: "event-bears-packers-2026-week-01",
    contestId: null,
    sourceMode: "manual",
    status: "processed",
    triggerType: "football.period_ended",
    occurredAt: overrides.occurredAt,
    submittedByUserId: "host-1",
    idempotencyKey: overrides.id,
    payload: overrides.payload ?? {},
    ...overrides,
  };
}

describe("football venue reward program", () => {
  it("stays hidden before a third-quarter reveal trigger", () => {
    const state = buildFootballVenueProgramState({
      event: null,
      triggers: [
        makeTrigger({
          id: "trigger-q2",
          occurredAt: "2026-09-11T02:10:00.000Z",
          payload: {
            period: "Q2",
            homeScore: 14,
            awayScore: 10,
          },
        }),
      ],
    });

    expect(state.revealStatus).toBe("hidden");
    expect(state.activeSquareKey).toBe("4-0");
    expect(state.activePeriodLabel).toBe("Q2");
  });

  it("reads a venue-defined hidden reward board from event metadata", () => {
    const state = buildFootballVenueProgramState({
      event: {
        metadata: {
          venueProgram: {
            headline: "Stay for the sponsor reveal.",
            rules: ["Rule A", "Rule B", "Rule C"],
            slots: [
              {
                id: "slot-custom",
                squareKey: "9-2",
                rewardName: "Free nachos",
                sponsorLabel: "Kitchen sponsor",
                redeemHint: "Redeem before the 4th quarter ends.",
              },
            ],
          },
        },
      },
      triggers: [],
    });

    expect(state.headline).toBe("Stay for the sponsor reveal.");
    expect(state.rules).toEqual(["Rule A", "Rule B", "Rule C"]);
    expect(state.slots).toHaveLength(1);
    expect(state.slots[0]).toMatchObject({
      squareKey: "9-2",
      rewardName: "Free nachos",
    });
  });

  it("reveals reward squares when Q3 is posted", () => {
    const state = buildFootballVenueProgramState({
      event: null,
      triggers: [
        makeTrigger({
          id: "trigger-q3",
          occurredAt: "2026-09-11T03:00:00.000Z",
          payload: {
            period: "Q3",
            homeScore: 17,
            awayScore: 13,
          },
        }),
      ],
    });

    expect(state.revealStatus).toBe("revealed");
    expect(state.revealTriggeredAt).toBe("2026-09-11T03:00:00.000Z");
    expect(state.activeSquareKey).toBe("7-3");
  });

  it("also treats a final trigger as a reveal fallback", () => {
    const state = buildFootballVenueProgramState({
      event: null,
      triggers: [
        makeTrigger({
          id: "trigger-final",
          triggerType: "football.event_final",
          occurredAt: "2026-09-11T03:45:00.000Z",
          payload: {
            period: "FINAL",
            homeScore: 21,
            awayScore: 17,
          },
        }),
      ],
    });

    expect(state.revealStatus).toBe("revealed");
    expect(state.activeSquareKey).toBe("1-7");
    expect(state.activePeriodLabel).toBe("FINAL");
  });
});
