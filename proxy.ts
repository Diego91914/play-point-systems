import { NextRequest, NextResponse } from "next/server";
import {
  gamesSessionOwns,
  GAMES_SESSION_COOKIE,
  verifyGamesSessionToken,
} from "@/lib/play-point-core/games-session";

const ACCOUNT_SESSION_PATH = "/api/games/account/session";
const SHOT_CADDY_HANDOFF_PATH = "/api/games/account/shot-caddy-handoff";

function requiredGameSku(pathname: string): string | null {
  if (pathname === "/games/holdem" || pathname.startsWith("/games/holdem/") || pathname === "/api/games/holdem" || pathname.startsWith("/api/games/holdem/")) return "game.phone_holdem";
  if (pathname === "/games/trivia" || pathname.startsWith("/games/trivia/") || pathname === "/api/trivia" || pathname.startsWith("/api/trivia/")) return "game.play_point_trivia";
  if (pathname === "/games/chain-reaction") return "game.chain_reaction";
  if (pathname === "/games/how-close") return "game.how_close";
  return null;
}

function isApiRequest(pathname: string): boolean { return pathname.startsWith("/api/"); }
function signInRedirect(request: NextRequest) { const target=request.nextUrl.clone();target.pathname="/games/sign-in";target.search="";target.searchParams.set("next",`${request.nextUrl.pathname}${request.nextUrl.search}`);return NextResponse.redirect(target); }

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRoomCode = Boolean(request.nextUrl.searchParams.get("code"));
  const isFamilyJoinPage = hasRoomCode && (pathname === "/games/chain-reaction" || pathname === "/games/how-close");
  const isFamilyRoomApi = pathname === "/api/games/chain-reaction" || pathname.startsWith("/api/games/chain-reaction/") || pathname === "/api/games/how-close" || pathname.startsWith("/api/games/how-close/");
  if (pathname === "/games/sign-in" || pathname.startsWith("/games/sign-in/") || pathname === ACCOUNT_SESSION_PATH || pathname === SHOT_CADDY_HANDOFF_PATH || pathname.endsWith("/opengraph-image") || isFamilyJoinPage || isFamilyRoomApi) { const response=NextResponse.next();response.headers.set("Cache-Control","private, no-store");return response; }
  const token=request.cookies.get(GAMES_SESSION_COOKIE)?.value; const claims=await verifyGamesSessionToken(token);
  if(!claims){if(isApiRequest(pathname))return NextResponse.json({error:"Play Point account sign-in is required."},{status:401,headers:{"Cache-Control":"private, no-store"}});return signInRedirect(request)}
  const gameSku=requiredGameSku(pathname);
  if(gameSku&&!gamesSessionOwns(claims,gameSku)){if(isApiRequest(pathname))return NextResponse.json({error:"This game is not owned by the signed-in account."},{status:403,headers:{"Cache-Control":"private, no-store"}});const target=request.nextUrl.clone();target.pathname="/games";target.search="";target.searchParams.set("locked",gameSku);return NextResponse.redirect(target)}
  const response=NextResponse.next();response.headers.set("Cache-Control","private, no-store");return response;
}

export const config={matcher:["/games","/games/:path*","/api/games/:path*","/api/trivia/:path*"]};
