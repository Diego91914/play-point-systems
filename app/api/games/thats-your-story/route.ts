import { NextRequest, NextResponse } from "next/server";
import { GAMES_SESSION_COOKIE, verifyGamesSessionToken } from "@/lib/play-point-core/games-session";
import { canHostDuringPrelaunch, prelaunchHostError } from "@/lib/play-point-core/prelaunch-access";
import { reservePlayAmplifiedSession, releasePlayAmplifiedSession } from "@/lib/play-point-core/room-registry";
import { createStoryRoom, joinStoryRoom, recoverStoryHost } from "@/lib/play-point-core/thats-your-story-server";

export async function POST(request:NextRequest) {
  try {
    const body=await request.json();
    if(body.intent==="join") return NextResponse.json({success:true,...await joinStoryRoom(body.code,body.name)},{headers:{"Cache-Control":"no-store"}});
    if(body.intent!=="create"&&body.intent!=="rejoin_host")throw new Error("Unknown request.");
    const claims=await verifyGamesSessionToken(request.cookies.get(GAMES_SESSION_COOKIE)?.value);
    if(!claims)return NextResponse.json({error:"Sign in to host That's Your Story?"},{status:401});
    if(!canHostDuringPrelaunch(claims))return NextResponse.json({error:prelaunchHostError()},{status:403});
    if(body.intent==="rejoin_host")return NextResponse.json({success:true,...await recoverStoryHost(body.code,claims.sub)},{headers:{"Cache-Control":"no-store"}});
    const session=await reservePlayAmplifiedSession({gameSku:"game.thats_your_story",joinHref:"/games/thats-your-story?code={code}",participationModel:"OPEN_LOBBY"});
    try {
      return NextResponse.json({success:true,...await createStoryRoom(body.name,claims.sub,session.code)},{headers:{"Cache-Control":"no-store"}});
    } catch(error) {
      await releasePlayAmplifiedSession(session.code).catch(()=>undefined);throw error;
    }
  } catch(error) {return NextResponse.json({error:error instanceof Error?error.message:"Unable to open game."},{status:400});}
}
