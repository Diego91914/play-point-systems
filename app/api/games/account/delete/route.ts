import { NextRequest, NextResponse } from "next/server";
import { requireGamesSupabaseUser } from "@/lib/play-point-core/games-access-server";
import { GAMES_SESSION_COOKIE } from "@/lib/play-point-core/games-session";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

function noStore(body: Record<string, unknown>, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { confirm?: string } | null;
    if (body?.confirm !== "DELETE") {
      return noStore({ error: "Account deletion requires explicit confirmation." }, 400);
    }

    const user = await requireGamesSupabaseUser(request);
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      throw new Error(`Unable to delete Play Amplified account: ${error.message}`);
    }

    const response = noStore({ success: true });
    response.cookies.set({
      name: GAMES_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete Play Amplified account.";
    const status = message.includes("sign-in") || message.includes("invalid or expired") ? 401 : 500;
    return noStore({ error: message }, status);
  }
}
