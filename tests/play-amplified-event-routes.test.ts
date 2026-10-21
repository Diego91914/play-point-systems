import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ account: vi.fn(), rpc: vi.fn(), load: vi.fn() }));
vi.mock("@/lib/play-point-core/quick-score-supabase", () => ({ getSupabaseServerClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/play-point-core/play-amplified-event-server", async importOriginal => ({
  ...await importOriginal<object>(),
  getAmplifiedEventAccount: mocks.account,
  loadOwnedAmplifiedEvent: mocks.load,
  generateUniqueAmplifiedEventJoinCode: async () => "ABCDEF",
}));
vi.mock("@/lib/play-point-core/play-amplified-event-hub-server", () => ({ loadOwnedAmplifiedEventHub: mocks.load }));

import { POST as create } from "@/app/api/events/route";
import { PATCH as save } from "@/app/api/events/[id]/route";
import { POST as publish } from "@/app/api/events/[id]/publish/route";
import { POST as start } from "@/app/api/events/[id]/start/route";
import { POST as join } from "@/app/api/events/join/[code]/route";
import { POST as score } from "@/app/api/events/[id]/results/route";
import { POST as complete } from "@/app/api/events/[id]/complete/route";

const organizerRoutes = [
  { action: "create", handler: create }, { action: "save", handler: save },
  { action: "publish", handler: publish }, { action: "start", handler: start },
  { action: "score", handler: score }, { action: "complete", handler: complete },
];
const body = { owner_user_id: "spoofed-owner", teams: [{ name: "Gold", participantIds: ["player"] }],
  activityId: "activity", entries: [{ entityType: "participant", entityId: "player", placement: 1 }] };
const request = () => new Request("https://example.test/api/events", { method: "POST", body: JSON.stringify(body) });
const context = () => ({ params: Promise.resolve({ id: "event" }) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.account.mockResolvedValue({ sub: "signed-owner" });
  mocks.rpc.mockResolvedValue({ data: { id: "event", resultVersion: 1 }, error: null });
  mocks.load.mockResolvedValue({ id: "event" });
});

describe("Play Amplified transactional route boundary", () => {
  it.each(organizerRoutes)("rejects unsigned $action before any database call", async ({ handler }) => {
    mocks.account.mockResolvedValue(null);
    expect((await handler(request(), context())).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each(organizerRoutes)("routes $action through one atomic RPC using the signed owner", async ({ action, handler }) => {
    const response = await handler(request(), context());
    expect(response.status).toBe(action === "create" ? 201 : 200);
    const rpc = ["score", "complete"].includes(action) ? "ppl_amplified_event_score" : "ppl_amplified_event_mutate";
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith(rpc, expect.objectContaining({
      p_action: action, p_owner_user_id: "signed-owner", p_event_id: action === "create" ? null : "event",
    }));
  });

  it.each(["PT404", "PT409"])("preserves %s from a rejected mutation without reloading", async code => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "Rejected" } });
    const response = await save(request(), context());
    expect(response.status).toBe(Number(code.slice(2)));
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("keeps anonymous registration behind the same atomic RPC", async () => {
    mocks.account.mockResolvedValue(null);
    mocks.rpc.mockResolvedValue({ data: { player: { display_name: "%" }, matched: false }, error: null });
    const response = await join(new Request("https://example.test", { method: "POST", body: JSON.stringify({ name: "%" }) }),
      { params: Promise.resolve({ code: "abcdef" }) });
    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("ppl_amplified_event_mutate", {
      p_action: "join", p_event_id: null, p_owner_user_id: null, p_payload: { code: "ABCDEF", name: "%" },
    });
  });
});
