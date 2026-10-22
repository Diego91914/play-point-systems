import { reservePlayAmplifiedSession, releasePlayAmplifiedSession } from "@/lib/play-point-core/room-registry";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

export async function POST(request: Request) {
  const claims = await verifyGamesSessionToken((await cookies()).get(GAMES_SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in to host." }, { status: 401 });
  if (!canHostDuringPrelaunch(claims, "game.clear_the_stack")) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
  const body=await request.json().catch(()=>({}));
  const distance=Math.max(1,Math.min(100,Number(body.distance)||20));
  const stackSize=Math.max(1,Math.min(100,Number(body.stackSize)||10));
  const supabase=getSupabaseServerClient();
  const session = await reservePlayAmplifiedSession({ gameSku: "game.clear_the_stack", participationModel: "HOSTED_ROSTER", joinHref: "/games/clear-the-stack/join/{code}", expiresAt: new Date(Date.now() + 86400000).toISOString() });
  const {data,error}=await supabase.from("ppl_clear_stack_rooms").insert({code:session.code,host_session_id:claims.sub,distance,stack_size:stackSize}).select("id,code,distance,stack_size,status").single();
  if(error || !data) { await releasePlayAmplifiedSession(session.code); return NextResponse.json({error:"Could not create join room."},{status:500}); }
  return NextResponse.json({room:data});
}
export async function GET(request: Request) {
  const id=new URL(request.url).searchParams.get("id");
  if(!id) return NextResponse.json({error:"Missing room."},{status:400});
  const supabase=getSupabaseServerClient();
  const {data:room}=await supabase.from("ppl_clear_stack_rooms").select("id,code,distance,stack_size,status").eq("id",id).maybeSingle();
  if(!room) return NextResponse.json({error:"Room not found."},{status:404});
  const {data:players,error}=await supabase.from("ppl_clear_stack_room_players").select("id,display_name,joined_at").eq("room_id",id).order("joined_at");
  if(error) return NextResponse.json({error:"Could not load players."},{status:500});
  return NextResponse.json({room,players:players??[]});
}
export async function PATCH(request: Request) {
  const body=await request.json().catch(()=>({}));
  const id=String(body.id??"");
  const claims = await verifyGamesSessionToken((await cookies()).get(GAMES_SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in to manage this room." }, { status: 401 });
  if (!canHostDuringPrelaunch(claims, "game.clear_the_stack")) return NextResponse.json({ error: prelaunchHostError() }, { status: 403 });
  if (!["closed", "playing"].includes(body.status)) return NextResponse.json({ error: "Invalid room status." }, { status: 400 });
  const host=claims.sub;
  if(!id||!host) return NextResponse.json({error:"Not authorized."},{status:401});
  const supabase=getSupabaseServerClient();
  const {data,error}=await supabase.from("ppl_clear_stack_rooms").update({status:body.status==="closed"?"closed":"playing"}).eq("id",id).eq("host_session_id",host).neq("status","closed").select("id").maybeSingle();
  if(error||!data) return NextResponse.json({error:"Could not update room."},{status:403});
  return NextResponse.json({ok:true});
}