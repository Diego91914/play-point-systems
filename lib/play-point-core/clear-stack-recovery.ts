import type { StackState } from "./clear-stack-engine";

export const CLEAR_STACK_HOST_ROOM_KEY = "pps-clear-stack-host-room";
export type ClearStackRecoveredRoom = {
  id: string; code: string; spectator_token: string; state_version: number; game_state: StackState;
};
type StorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export async function recoverClearStackHostRoom(storage: StorageAccess | null, request: typeof fetch): Promise<ClearStackRecoveredRoom | null> {
  let savedId: string | null = null;
  try { savedId = storage?.getItem(CLEAR_STACK_HOST_ROOM_KEY) ?? null; } catch {}
  const query = savedId ? `?id=${encodeURIComponent(savedId)}` : "";
  let response = await request(`/api/games/clear-the-stack/room${query}`, { cache: "no-store" });
  if (savedId && [400, 404, 410].includes(response.status)) {
    // The old pointer may belong to another account or ended session. Discover
    // this account's live room before changing its local recovery cache.
    response = await request("/api/games/clear-the-stack/room", { cache: "no-store" });
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      if (!savedId) return null;
      throw new Error("Sign in again to resume your saved game. Your recovery link has been kept.");
    }
    throw new Error("Could not restore your hosted game. Reconnect and refresh to retry.");
  }
  const payload: { room?: ClearStackRecoveredRoom | null } = await response.json();
  if (!Object.hasOwn(payload, "room")) throw new Error("Your saved game could not be verified. Refresh to retry.");
  if (payload.room === null) return null;
  const room = payload.room;
  if (!room?.id || !room.spectator_token || !room.game_state || !["setup", "playing", "finished"].includes(room.game_state.phase)) {
    throw new Error("Your saved game could not be verified. Refresh to retry.");
  }
  try { storage?.setItem(CLEAR_STACK_HOST_ROOM_KEY, room.id); } catch {}
  return room;
}
