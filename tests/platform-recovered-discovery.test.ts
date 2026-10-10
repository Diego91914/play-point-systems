import fs from "node:fs/promises";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
type Database={exec:(sql:string)=>Promise<unknown>;query:<T=Record<string,unknown>>(sql:string,args?:unknown[])=>Promise<{rows:T[]}>;close:()=>Promise<void>};
const fixture=vi.hoisted(()=>({db:null as Database|null}));
vi.mock("@/lib/play-point-core/quick-score-supabase",()=>({getSupabaseServerClient:()=>({from:(table:string)=>{
 const filters:Array<[string,unknown]>=[];let columns="*";let patch:Record<string,unknown>|null=null;
 const q={select:(value:string)=>{columns=value;return q;},eq:(key:string,value:unknown)=>{filters.push([key,value]);return q;},ilike:(key:string,value:unknown)=>{filters.push([key+' ILIKE',value]);return q;},limit:()=>q,neq:(key:string,value:unknown)=>{filters.push([key+' <>',value]);return q;},update:(value:Record<string,unknown>)=>{patch=value;return q;},maybeSingle:async()=>{
  try{const params=filters.map(x=>x[1]);const where=filters.map(([key],i)=>(key.endsWith(' <>')||key.endsWith(' ILIKE'))?`${key} $${i+1}`:`${key}=$${i+1}`).join(' AND ');
   let sql=`SELECT ${columns} FROM ${table} WHERE ${where}`;
   if(patch){const offset=params.length;const sets=Object.keys(patch).map((k,i)=>`${k}=$${offset+i+1}`);params.push(...Object.values(patch));sql=`UPDATE ${table} SET ${sets.join(',')} WHERE ${where} RETURNING ${columns}`;}
   const result=await fixture.db!.query(sql,params);return{data:result.rows[0]?JSON.parse(JSON.stringify(result.rows[0])):null,error:null};
  }catch(error){return{data:null,error:{message:String(error)}};}
 }};return q;
},rpc:async(name:string,args:{p_owner:string;p_code:string})=>{
 try{const result=await fixture.db!.query(`SELECT ${name}($1,$2) AS room`,[args.p_owner,args.p_code]);return{data:result.rows[0]?.room,error:null};}catch(error){return{data:null,error};}
}})}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>undefined})}));
vi.mock("@/lib/play-point-core/games-session",()=>({GAMES_SESSION_COOKIE:"pps_games_session",verifyGamesSessionToken:async()=>({sub:'owner',role:'founder',entitlements:['*']}),isPrivilegedGamesSession:()=>true}));
import { resolvePlayAmplifiedSession } from "../lib/play-point-core/room-registry";
import { POST as recover } from "../app/api/games/clear-the-stack/room/recover/route";
import { PATCH as renew } from "../app/api/games/clear-the-stack/room/route";
import { GET as guestView, POST as guestRejoin } from "../app/api/games/clear-the-stack/join/route";
import { GET as quickJoin } from "../app/api/play/rooms/resolve/route";
import { NextRequest } from "next/server";
const enabled=Boolean(process.env.PGLITE_MODULE_PATH);
beforeAll(async()=>{
 if(!enabled)return;
 const {PGlite}=await import(process.env.PGLITE_MODULE_PATH!);fixture.db=new PGlite() as Database;
 await fixture.db.exec(await fs.readFile('supabase/tests/fixtures/league-night-transaction.sql','utf8'));
 for(const file of ['20261009233921_legacy_session_directory_codes.sql','20261009235737_hosted_session_activity.sql','20261010002712_clear_stack_owner_recovery.sql'])await fixture.db.exec(await fs.readFile('supabase/migrations/'+file,'utf8'));
 await fixture.db.exec("UPDATE ppl_clear_stack_rooms SET host_session_id='owner',status='playing' WHERE code='CTS234'; CREATE TABLE ppl_clear_stack_room_players(id uuid DEFAULT gen_random_uuid(), room_id uuid, display_name text, joined_at timestamptz DEFAULT now()); INSERT INTO ppl_clear_stack_room_players(room_id,display_name) SELECT id,'Guest' FROM ppl_clear_stack_rooms WHERE code='CTS234'; CREATE TABLE test_existing_scores(room_code text,player text,score numeric,rounds jsonb); INSERT INTO test_existing_scores VALUES('CTS234','Guest',12.5,'[4,3,2]');");
});
afterAll(async()=>{await fixture.db?.close();});
const request=(body:unknown)=>new Request('https://example.test/api/room',{method:'POST',body:JSON.stringify(body)});
it.skipIf(!enabled)("recovers missing entry and actual Quick Join resolves original QR destination without changing scores/status",async()=>{
 const before=(await fixture.db!.query('SELECT * FROM test_existing_scores')).rows;
 expect((await recover(request({code:'CTS234'}))).status).toBe(200);
 const response=await quickJoin(new NextRequest('https://example.test/api/play/rooms/resolve?code=CTS234'));
 expect(response.status).toBe(200);const data=await response.json();expect(data.room.joinHref).toBe('/games/clear-the-stack/join/CTS234');
 expect((await guestView(new Request('https://example.test/api/games/clear-the-stack/join?code=CTS234'))).status).toBe(200);
 expect((await guestRejoin(request({code:'CTS234',name:'Guest'}))).status).toBe(200);
 expect((await guestRejoin(request({code:'CTS234',name:'New player'}))).status).toBe(409);
 expect((await fixture.db!.query('SELECT count(*)::integer AS n FROM ppl_clear_stack_room_players')).rows[0].n).toBe(1);
 expect((await fixture.db!.query('SELECT * FROM test_existing_scores')).rows).toEqual(before);
 expect((await fixture.db!.query("SELECT status FROM ppl_clear_stack_rooms WHERE code='CTS234'")).rows[0].status).toBe('playing');
});
it.skipIf(!enabled)("expired directory entry survives recovery unchanged while real resolver uses renewed authoritative activity",async()=>{
 await fixture.db!.exec("UPDATE ppl_room_registry SET expires_at='2000-01-01' WHERE code='CTS234';");
 const before=(await fixture.db!.query("SELECT * FROM ppl_room_registry WHERE code='CTS234'")).rows;
 expect((await recover(request({code:'CTS234'}))).status).toBe(200);
 expect((await resolvePlayAmplifiedSession('CTS234'))?.code).toBe('CTS234');
 expect((await fixture.db!.query("SELECT * FROM ppl_room_registry WHERE code='CTS234'")).rows).toEqual(before);
});
it.skipIf(!enabled)("normal owner renewal restores discovery after idle lease without another recovery",async()=>{
 // Disable the clock trigger only in this isolated fixture to model elapsed activity.
 await fixture.db!.exec("ALTER TABLE ppl_clear_stack_rooms DISABLE TRIGGER ppl_clear_stack_rooms_activity; UPDATE ppl_clear_stack_rooms SET updated_at='2000-01-01' WHERE code='CTS234'; ALTER TABLE ppl_clear_stack_rooms ENABLE TRIGGER ppl_clear_stack_rooms_activity;");
 expect(await resolvePlayAmplifiedSession('CTS234')).toBeNull();
 const id=(await fixture.db!.query("SELECT id FROM ppl_clear_stack_rooms WHERE code='CTS234'")).rows[0].id;
 expect((await renew(request({id,status:'playing'}))).status).toBe(200);
 expect((await resolvePlayAmplifiedSession('CTS234'))?.code).toBe('CTS234');
 expect((await fixture.db!.query('SELECT * FROM test_existing_scores')).rows[0].score).toBe('12.5');
});
it.skipIf(!enabled)("closed recovered room disappears immediately and cannot renew or recover",async()=>{
 const id=(await fixture.db!.query("SELECT id FROM ppl_clear_stack_rooms WHERE code='CTS234'")).rows[0].id;
 expect((await renew(request({id,status:'closed'}))).status).toBe(200);expect(await resolvePlayAmplifiedSession('CTS234')).toBeNull();
 expect((await renew(request({id,status:'playing'}))).status).toBe(403);
 expect((await recover(request({code:'CTS234'}))).status).not.toBe(200);
});
