export function assertPlayAmplifiedRoomActive(state: unknown) {
  if (!state || typeof state !== "object") return;
  if ("playAmplifiedEndedAt" in state && (state as { playAmplifiedEndedAt?: unknown }).playAmplifiedEndedAt) {
    throw new Error("The host ended this session.");
  }
}
