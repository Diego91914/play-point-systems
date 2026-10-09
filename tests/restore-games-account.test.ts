import { describe, expect, it, vi } from "vitest";
import { restoreGamesAccount } from "@/lib/play-point-core/restore-games-account";

describe("account restoration through verified handoff", () => {
  it("exchanges a persisted login for a server-verified platform session", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ handoffCode: "one-time-code" }))
      .mockResolvedValueOnce(Response.json({ success: true }));
    expect(await restoreGamesAccount("saved-access-token", request)).toBe(true);
    expect(request.mock.calls[0][1]?.headers).toEqual({ Authorization: "Bearer saved-access-token" });
    expect(request.mock.calls[1][0]).toBe("/api/games/account/shot-caddy-handoff");
    expect(JSON.parse(request.mock.calls[1][1]?.body as string)).toEqual({ code: "one-time-code" });
  });
  it("allows private access fallback when the saved login is expired", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}, { status: 401 }));
    expect(await restoreGamesAccount("expired", request)).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it.each([500, 502])("does not silently downgrade an account after service failure %s", async (status) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}, { status }));
    await expect(restoreGamesAccount("saved", request)).rejects.toThrow("verify");
  });
  it("does not navigate after an unsuccessful handoff redemption", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ handoffCode: "used-code" }))
      .mockResolvedValueOnce(Response.json({}, { status: 401 }));
    await expect(restoreGamesAccount("saved", request)).rejects.toThrow("restore");
  });
});
