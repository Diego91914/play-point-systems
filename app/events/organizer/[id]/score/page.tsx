import { getAmplifiedEventAccount } from "@/lib/play-point-core/play-amplified-event-server";
import { PlayAmplifiedEventScoringClient } from "./PlayAmplifiedEventScoringClient";

export default async function PlayAmplifiedEventScoringPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, claims] = await Promise.all([params, getAmplifiedEventAccount()]);
  return <PlayAmplifiedEventScoringClient eventId={id} signedIn={Boolean(claims)} />;
}
