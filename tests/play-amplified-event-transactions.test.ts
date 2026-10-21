import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// This suite creates and drops its own database on a disposable local cluster.
// It never reads application or production database environment variables.
const testUrl = process.env.AMPLIFIED_EVENT_TEST_DATABASE_URL;
const database = `amplified_test_${process.pid}_${Date.now()}`;
let admin: Client;
let db: Client;
const connections: Client[] = [];
const migrations = readdirSync(join(process.cwd(), "supabase/migrations"));

async function connection(role = true) {
  const url = new URL(testUrl!);
  url.pathname = `/${database}`;
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  connections.push(client);
  if (role) await client.query("set role service_role");
  return client;
}

async function mutate(client: Client, action: string, id: string | null, payload: unknown = {}, owner = "owner") {
  const result = await client.query("select public.ppl_amplified_event_mutate($1, $2, $3, $4) as result", [action, id, owner, payload]);
  return result.rows[0].result;
}

const draft = {
  templateId: "test", name: "Championship", eventDate: null, teamCount: 1,
  participants: [{ name: "Alex", skill: 3 }],
  activities: [{ moduleId: "custom-challenge", label: "Challenge", order: 1 }],
};

async function event() {
  const { id } = await mutate(db, "create", null, draft);
  const { rows: [player] } = await db.query("select id from public.ppl_amplified_event_participants where event_id=$1", [id]);
  return { id: id as string, playerId: player.id as string };
}

async function publish(id: string) {
  const code = id.replaceAll("-", "").slice(0, 8).toUpperCase();
  await mutate(db, "publish", id, { joinCode: code });
  return code;
}

const teams = (playerId: string) => ({ teams: [{ name: "Gold", participantIds: [playerId] }] });

// Queue the second operation behind an actual PostgreSQL row lock. Check the
// backend lock wait so these tests prove interleavings rather than timing luck.
async function behindLock<T>(id: string, first: (client: Client) => Promise<unknown>, second: (client: Client) => Promise<T>) {
  const holder = await connection();
  const waiter = await connection();
  const { rows: [{ pid }] } = await waiter.query("select pg_backend_pid() as pid");
  await holder.query("begin");
  await holder.query("select id from public.ppl_amplified_events where id=$1 for update", [id]);
  const pending = second(waiter).then(value => ({ value, error: null }), error => ({ value: undefined, error }));
  try {
    const deadline = Date.now() + 5000;
    let blocked = false;
    while (Date.now() < deadline) {
      const { rows } = await admin.query("select wait_event_type from pg_stat_activity where pid=$1", [pid]);
      if (rows[0]?.wait_event_type === "Lock") { blocked = true; break; }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    expect(blocked, "competing mutation must wait for the event lock").toBe(true);
    await first(holder);
    await holder.query("commit");
    return await pending;
  } catch (error) {
    await holder.query("rollback");
    await pending;
    throw error;
  }
}

describe.skipIf(!testUrl)("Play Amplified PostgreSQL transactions", () => {
  beforeAll(async () => {
    const url = new URL(testUrl!);
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Use a disposable local PostgreSQL cluster.");
    admin = new Client({ connectionString: testUrl });
    await admin.connect();
    for (const role of ["anon", "authenticated", "service_role"]) {
      await admin.query(`do $$ begin if not exists (select 1 from pg_roles where rolname='${role}') then create role ${role}; end if; end $$`);
    }
    // Match Supabase's service_role on this disposable local cluster.
    await admin.query("alter role service_role bypassrls");
    await admin.query(`create database ${database}`);
    db = await connection(false);
    const selected = ["20261015214500_play_amplified_events_persistence.sql",
      ...migrations.filter(name => name.endsWith("_play_amplified_event_atomic_lifecycle.sql"))];
    for (const name of selected.sort()) await db.query(readFileSync(join(process.cwd(), "supabase/migrations", name), "utf8"));
    await db.query("set role service_role");
  }, 20000);

  afterAll(async () => {
    await Promise.all(connections.map(client => client.end()));
    if (admin) {
      await admin.query(`drop database if exists ${database} with (force)`);
      await admin.end();
    }
  });

  it("uses literal case-insensitive name matching for percent and underscore", async () => {
    const { id, playerId } = await event();
    const code = await publish(id);
    for (const name of ["%", "_"]) {
      const result = await mutate(db, "join", null, { code, name });
      expect(result.matched).toBe(false);
      expect(result.player.display_name).toBe(name);
    }
    const result = await mutate(db, "join", null, { code, name: "alex" });
    expect(result.matched).toBe(true);
    expect(result.player.id).toBe(playerId);
  });

  it("rejects a stale roster when a join commits before start", async () => {
    const { id, playerId } = await event();
    const code = await publish(id);
    const result = await behindLock(id,
      client => mutate(client, "join", null, { code, name: "Jordan" }),
      client => mutate(client, "start", id, teams(playerId)));
    expect(result.error?.code).toBe("PT400");
    expect((await db.query("select status from public.ppl_amplified_events where id=$1", [id])).rows[0].status).toBe("published");
  });

  it("rejects a join waiting behind start without adding an unassigned participant", async () => {
    const { id, playerId } = await event();
    const code = await publish(id);
    const result = await behindLock(id,
      client => mutate(client, "start", id, teams(playerId)),
      client => mutate(client, "join", null, { code, name: "Late player" }));
    expect(result.error?.code).toBe("PT409");
    expect((await db.query("select count(*)::int as count from public.ppl_amplified_event_participants where event_id=$1", [id])).rows[0].count).toBe(1);
  });

  it("does not delete the winning teams when two starts overlap", async () => {
    const { id, playerId } = await event();
    await publish(id);
    let winningIds: string[] = [];
    const result = await behindLock(id, async client => {
      await mutate(client, "start", id, teams(playerId));
      winningIds = (await client.query("select id from public.ppl_amplified_event_teams where event_id=$1", [id])).rows.map(row => row.id);
    }, client => mutate(client, "start", id, teams(playerId)));
    expect(result.error?.code).toBe("PT409");
    expect((await db.query("select id from public.ppl_amplified_event_teams where event_id=$1", [id])).rows.map(row => row.id)).toEqual(winningIds);
  });

  it("locks draft replacement against publication", async () => {
    const { id, playerId } = await event();
    const result = await behindLock(id,
      client => mutate(client, "publish", id, { joinCode: "LOCKED" }),
      client => mutate(client, "save", id, { ...draft, name: "Stale edit" }));
    expect(result.error?.code).toBe("PT409");
    expect((await db.query("select id from public.ppl_amplified_event_participants where event_id=$1", [id])).rows[0].id).toBe(playerId);
  });

  it("rolls back draft metadata and children together when replacement fails", async () => {
    const { id, playerId } = await event();
    await expect(mutate(db, "save", id, { ...draft, name: "Must roll back", activities: [draft.activities[0], draft.activities[0]] })).rejects.toMatchObject({ code: "23505" });
    expect((await db.query("select name from public.ppl_amplified_events where id=$1", [id])).rows[0].name).toBe(draft.name);
    expect((await db.query("select id from public.ppl_amplified_event_participants where event_id=$1", [id])).rows[0].id).toBe(playerId);
  });

  it("rejects another owner and denies browser roles direct RPC access", async () => {
    const { id } = await event();
    await expect(mutate(db, "save", id, draft, "other-owner")).rejects.toMatchObject({ code: "PT404" });
    for (const role of ["anon", "authenticated"]) {
      const client = await connection(false);
      await client.query(`set role ${role}`);
      await expect(mutate(client, "publish", id, { joinCode: "DENIED" })).rejects.toMatchObject({ code: "42501" });
      await expect(client.query("select * from public.ppl_amplified_events")).rejects.toMatchObject({ code: "42501" });
    }
  });
});
