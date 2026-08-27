import { NextRequest, NextResponse } from "next/server";
import { actHowCloseRoom, getHowCloseRoom } from "@/lib/play-point-core/how-close-server";

export async function GET(request:NextRequest,{params}:{params:Promise<{code:string}>}){try{const{code}=await params;const id=request.nextUrl.searchParams.get("playerId")??"",token=request.nextUrl.searchParams.get("token")??"";return NextResponse.json({success:true,...await getHowCloseRoom(code,id,token)})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to load game."},{status:400})}}
export async function POST(request:NextRequest,{params}:{params:Promise<{code:string}>}){try{const{code}=await params;const body=await request.json().catch(()=>({}));return NextResponse.json({success:true,...await actHowCloseRoom(code,body.playerId,body.token,body.action,body.payload)})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to update game."},{status:400})}}
