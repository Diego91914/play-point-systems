import type {
  ContestResolutionBatch,
  ContestResolver,
  FootballFinalScoreSelection,
  FootballSquaresSelection,
  FootballWinnerSelection,
  PlayPointContest,
  PlayPointEntry,
  PlayPointTrigger,
  ResolutionRow,
} from "./runtime-contracts";

interface FootballFinalScorePayload {
  homeTeamKey: string;
  awayTeamKey: string;
  homeScore: number;
  awayScore: number;
  period?: string;
}

function normalizePeriod(value?: string): string {
  return value?.trim().toUpperCase() || "FINAL";
}

function makeResolution(args: {
  trigger: PlayPointTrigger;
  contest: PlayPointContest;
  entry: PlayPointEntry;
  ruleKey: string;
  scoreDelta: number;
  playPointsDelta: number;
  placement?: number | null;
  accuracyDelta?: number | null;
  isVictory: boolean;
  metadata?: Record<string, unknown>;
}): ResolutionRow {
  return {
    id: `${args.trigger.id}:${args.entry.id}:${args.ruleKey}`,
    triggerId: args.trigger.id,
    contestId: args.contest.id,
    entryId: args.entry.id,
    userId: args.entry.userId,
    ruleKey: args.ruleKey,
    scoreDelta: args.scoreDelta,
    playPointsDelta: args.playPointsDelta,
    placement: args.placement ?? null,
    accuracyDelta: args.accuracyDelta ?? null,
    isVictory: args.isVictory,
    metadata: args.metadata,
    resolvedAt: args.trigger.occurredAt,
  };
}

function buildBatch(args: {
  trigger: PlayPointTrigger;
  contest: PlayPointContest;
  entries: PlayPointEntry[];
  resolutions: ResolutionRow[];
  metadata?: Record<string, unknown>;
}): ContestResolutionBatch {
  return {
    trigger: args.trigger,
    contest: args.contest,
    entries: args.entries,
    resolutions: args.resolutions,
    metadata: args.metadata,
  };
}

export class FootballWinnerPickResolver implements ContestResolver {
  supports(formatKey: PlayPointContest["formatKey"]): boolean {
    return formatKey === "winner_pick";
  }

  async resolve(args: {
    contest: PlayPointContest;
    trigger: PlayPointTrigger;
    entries: PlayPointEntry[];
  }): Promise<ContestResolutionBatch> {
    const payload = args.trigger.payload as unknown as FootballFinalScorePayload;
    const winningTeamKey =
      payload.homeScore === payload.awayScore
        ? null
        : payload.homeScore > payload.awayScore
          ? payload.homeTeamKey
          : payload.awayTeamKey;

    const resolutions = args.entries.map((entry) => {
      const selection = entry.selection as unknown as FootballWinnerSelection;
      const isCorrect = winningTeamKey !== null && selection.teamKey === winningTeamKey;

      return makeResolution({
        trigger: args.trigger,
        contest: args.contest,
        entry,
        ruleKey: "winner_pick.final",
        scoreDelta: isCorrect ? 10 : 0,
        playPointsDelta: isCorrect ? 5 : 0,
        accuracyDelta: isCorrect ? 1 : 0,
        isVictory: false,
        metadata: { winningTeamKey },
      });
    });

    return buildBatch({
      trigger: args.trigger,
      contest: args.contest,
      entries: args.entries,
      resolutions,
      metadata: { winningTeamKey },
    });
  }
}

export class FootballFinalScoreResolver implements ContestResolver {
  supports(formatKey: PlayPointContest["formatKey"]): boolean {
    return formatKey === "final_score";
  }

  async resolve(args: {
    contest: PlayPointContest;
    trigger: PlayPointTrigger;
    entries: PlayPointEntry[];
  }): Promise<ContestResolutionBatch> {
    const payload = args.trigger.payload as unknown as FootballFinalScorePayload;

    const ranked = args.entries
      .map((entry) => {
        const selection = entry.selection as unknown as FootballFinalScoreSelection;
        const distance =
          Math.abs(selection.homeScore - payload.homeScore) +
          Math.abs(selection.awayScore - payload.awayScore);

        const exact =
          selection.homeScore === payload.homeScore &&
          selection.awayScore === payload.awayScore;

        return { entry, selection, distance, exact };
      })
      .sort((left, right) => left.distance - right.distance);

    const bestDistance = ranked[0]?.distance ?? null;

    const resolutions = ranked.map((item, index) => {
      const isClosest = bestDistance !== null && item.distance === bestDistance;
      const isExact = item.exact;

      return makeResolution({
        trigger: args.trigger,
        contest: args.contest,
        entry: item.entry,
        ruleKey: "final_score.final",
        scoreDelta: isExact ? 40 : isClosest ? 20 : 0,
        playPointsDelta: isExact ? 25 : isClosest ? 10 : 0,
        placement: index + 1,
        accuracyDelta: isExact ? 1 : Math.max(0, 1 - item.distance / 20),
        isVictory: isClosest,
        metadata: {
          exact: isExact,
          closest: isClosest,
          distance: item.distance,
        },
      });
    });

    return buildBatch({
      trigger: args.trigger,
      contest: args.contest,
      entries: args.entries,
      resolutions,
      metadata: {
        finalScore: {
          homeScore: payload.homeScore,
          awayScore: payload.awayScore,
        },
      },
    });
  }
}

export class FootballSquaresResolver implements ContestResolver {
  supports(formatKey: PlayPointContest["formatKey"]): boolean {
    return formatKey === "football_squares";
  }

  async resolve(args: {
    contest: PlayPointContest;
    trigger: PlayPointTrigger;
    entries: PlayPointEntry[];
  }): Promise<ContestResolutionBatch> {
    const payload = args.trigger.payload as unknown as FootballFinalScorePayload;
    const homeDigit = Math.abs(payload.homeScore % 10);
    const awayDigit = Math.abs(payload.awayScore % 10);
    const period = normalizePeriod(payload.period);
    const settlePeriods = Array.isArray(args.contest.config.settlePeriods)
      ? args.contest.config.settlePeriods
          .filter((value): value is string => typeof value === "string")
          .map((value) => normalizePeriod(value))
      : ["FINAL"];

    if (!settlePeriods.includes(period)) {
      return buildBatch({
        trigger: args.trigger,
        contest: args.contest,
        entries: args.entries,
        resolutions: [],
        metadata: {
          skipped: true,
          reason: "period_not_settled",
          period,
        },
      });
    }

    const quarterScoreDelta =
      typeof args.contest.config.quarterScoreDelta === "number"
        ? args.contest.config.quarterScoreDelta
        : 25;
    const finalScoreDelta =
      typeof args.contest.config.finalScoreDelta === "number"
        ? args.contest.config.finalScoreDelta
        : 100;
    const quarterPlayPointsDelta =
      typeof args.contest.config.quarterPlayPointsDelta === "number"
        ? args.contest.config.quarterPlayPointsDelta
        : 10;
    const finalPlayPointsDelta =
      typeof args.contest.config.finalPlayPointsDelta === "number"
        ? args.contest.config.finalPlayPointsDelta
        : 50;
    const isFinalPeriod = period === "FINAL";

    const resolutions = args.entries.map((entry) => {
      const selection = entry.selection as unknown as
        | FootballSquaresSelection
        | {
            squares?: Array<Partial<FootballSquaresSelection>>;
          };
      const directHomeDigit =
        "homeDigit" in selection && typeof selection.homeDigit === "number"
          ? selection.homeDigit
          : null;
      const directAwayDigit =
        "awayDigit" in selection && typeof selection.awayDigit === "number"
          ? selection.awayDigit
          : null;
      const squareSelections =
        "squares" in selection && Array.isArray(selection.squares)
          ? selection.squares
            .map((square) => ({
              homeDigit:
                typeof square.homeDigit === "number" ? square.homeDigit : null,
              awayDigit:
                typeof square.awayDigit === "number" ? square.awayDigit : null,
            }))
            .filter(
              (
                square,
              ): square is {
                homeDigit: number;
                awayDigit: number;
              } => square.homeDigit !== null && square.awayDigit !== null,
            )
          : [];
      const isHit =
        (directHomeDigit === homeDigit && directAwayDigit === awayDigit) ||
        squareSelections.some(
          (square) =>
            square.homeDigit === homeDigit && square.awayDigit === awayDigit,
        );

      return makeResolution({
        trigger: args.trigger,
        contest: args.contest,
        entry,
        ruleKey: `football_squares.${period.toLowerCase()}`,
        scoreDelta: isHit ? (isFinalPeriod ? finalScoreDelta : quarterScoreDelta) : 0,
        playPointsDelta: isHit
          ? isFinalPeriod
            ? finalPlayPointsDelta
            : quarterPlayPointsDelta
          : 0,
        placement: isHit ? 1 : null,
        accuracyDelta: isHit ? 1 : 0,
        isVictory: isHit,
        metadata: {
          period,
          winningHomeDigit: homeDigit,
          winningAwayDigit: awayDigit,
        },
      });
    });

    return buildBatch({
      trigger: args.trigger,
      contest: args.contest,
      entries: args.entries,
      resolutions,
      metadata: {
        period,
        winningDigits: {
          homeDigit,
          awayDigit,
        },
      },
    });
  }
}
