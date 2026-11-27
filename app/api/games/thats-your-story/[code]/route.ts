import { NextRequest, NextResponse } from "next/server";
import { actStoryRoom, getStoryRoom } from "@/lib/play-point-core/thats-your-story-server";
type Context={params:Promise<{code:string}>};
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:NextRequest,{params}:Context) {
  try {
    const {code}=await params;
    return NextResponse.json({success:true,...await getStoryRoom(code,request.nextUrl.searchParams.get("playerId"),request.nextUrl.searchParams.get("token"))},{headers});
  } catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to load game."},{status:400,headers});}
}
export async function POST(request:NextRequest,{params}:Context) {
  try {
    const {code}=await params,body=await request.json();
    const payload=body.action==="restart"&&!body.payload?.roundId
      ? {...body.payload,roundId:(await getStoryRoom(code,body.playerId,body.token)).state.roundId}:body.payload;
    return NextResponse.json({success:true,...await actStoryRoom(code,body.playerId,body.token,body.action,payload)},{headers});
  } catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to update game."},{status:400,headers});}
}
