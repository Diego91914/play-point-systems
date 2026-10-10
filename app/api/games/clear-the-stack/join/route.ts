import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
async function room(code:string){
 const supabase=getSupabaseServerClient();
 const {data}=await supabase.from("ppl_clear_stack_rooms").select("id,code,distance,stack_size,status").eq("code",code.toUpperCase()).maybeSingle();
 return data;
}
export async function GET(request:Request){
 const code=new URL(request.url).searchParams.get("code")??"";
 const data=await room(code);
 if(!data||!["open","playing"].includes(data.status)) return NextResponse.json({error:"This game is not accepting players."},{status:404});
 return NextResponse.json({room:data});
}
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));
 const code=String(body.code??"").trim().toUpperCase();
 const name=String(body.name??"").trim().replace(/\s+/g," ").slice(0,50);
 if(!code||!name) return NextResponse.json({error:"Enter your name."},{status:400});
 const data=await room(code);
 if(!data||!["open","playing"].includes(data.status)) return NextResponse.json({error:"This game is not accepting players."},{status:404});
 const supabase=getSupabaseServerClient();
 const {data:existing}=await supabase.from("ppl_clear_stack_room_players").select("id").eq("room_id",data.id).ilike("display_name",name).limit(1).maybeSingle();
 if(existing) return NextResponse.json({ok:true,matched:true});
 if(data.status!=="open") return NextResponse.json({error:"This game has started. Only existing players can rejoin."},{status:409});
 const {error}=await supabase.from("ppl_clear_stack_room_players").insert({room_id:data.id,display_name:name});
 if(error) return NextResponse.json({error:"Could not join game."},{status:500});
 return NextResponse.json({ok:true,matched:false});
}