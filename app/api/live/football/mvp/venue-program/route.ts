import { NextResponse } from "next/server";
import {
  buildFootballVenueProgramState,
  footballMvpRuntime,
  readFootballVenueProgramConfig,
  type FootballVenueProgramConfig,
  type FootballVenueRewardSlot,
} from "@/lib/play-point-core";

interface VenueProgramBody {
  eventId?: string;
  headline?: string;
  rules?: string[];
  slots?: Array<Partial<FootballVenueRewardSlot>>;
}

function normalizeSquareKeyValue(value: string) {
  return value.trim().replaceAll(" ", "").replaceAll("_", "-").toUpperCase();
}

function normalizeSlot(
  slot: Partial<FootballVenueRewardSlot>,
  index: number,
): FootballVenueRewardSlot | null {
  const squareKey =
    typeof slot.squareKey === "string"
      ? normalizeSquareKeyValue(slot.squareKey)
      : "";
  const rewardName =
    typeof slot.rewardName === "string" ? slot.rewardName.trim() : "";

  if (!squareKey || !rewardName) {
    return null;
  }

  return {
    id:
      typeof slot.id === "string" && slot.id.trim().length > 0
        ? slot.id.trim()
        : `reward-slot-${index + 1}`,
    squareKey,
    rewardName,
    sponsorLabel:
      typeof slot.sponsorLabel === "string" ? slot.sponsorLabel.trim() : "",
    redeemHint:
      typeof slot.redeemHint === "string" ? slot.redeemHint.trim() : "",
  };
}

function normalizeConfig(body: VenueProgramBody): FootballVenueProgramConfig {
  const defaults = readFootballVenueProgramConfig(null);
  const slots = Array.isArray(body.slots)
    ? body.slots
        .map((slot, index) => normalizeSlot(slot, index))
        .filter((slot): slot is FootballVenueRewardSlot => slot !== null)
    : [];
  const rules = Array.isArray(body.rules)
    ? body.rules
        .map((rule) => (typeof rule === "string" ? rule.trim() : ""))
        .filter((rule) => rule.length > 0)
    : [];

  return {
    revealPeriod: "Q3",
    headline:
      typeof body.headline === "string" && body.headline.trim().length > 0
        ? body.headline.trim()
        : defaults.headline,
    rules: rules.length > 0 ? rules : defaults.rules,
    slots: slots.length > 0 ? slots : defaults.slots,
  };
}

export async function POST(request: Request) {
  let body: VenueProgramBody;

  try {
    body = (await request.json()) as VenueProgramBody;
  } catch {
    return NextResponse.json(
      { saved: false, error: "A valid JSON request body is required." },
      { status: 400 },
    );
  }

  const eventId = body.eventId ?? footballMvpRuntime.seed.events?.[0]?.id;

  if (!eventId) {
    return NextResponse.json(
      { saved: false, error: "No football MVP event is available yet." },
      { status: 400 },
    );
  }

  try {
    const config = normalizeConfig(body);
    const result = await footballMvpRuntime.saveVenueProgramConfig({
      eventId,
      config,
    });
    const debugState = await footballMvpRuntime.inspectDebugState();

    return NextResponse.json({
      saved: true,
      event: result.event,
      venueProgram: buildFootballVenueProgramState({
        event: result.event,
        triggers: debugState.triggers,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        saved: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the venue reward board.",
      },
      { status: 400 },
    );
  }
}
