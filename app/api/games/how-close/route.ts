import { NextRequest, NextResponse } from "next/server";
import { createHowCloseRoom, joinHowCloseRoom } from "@/lib/play-point-core/how-close-server";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";

export async function POST(request:NextRequest){try{const body=await request.json().catch(()=>({}));if(body.intent==="create"){const claims=await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);if(!claims)return NextResponse.json({error:"Sign in to host How Close Are We?."},{status:401});return NextResponse.json({success:true,...await createHowCloseRoom(body.name)})}if(body.intent==="join")return NextResponse.json({success:true,...await joinHowCloseRoom(body.code,body.name)});return NextResponse.json({error:"Unknown request."},{status:400})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to open game."},{status:400})}}
