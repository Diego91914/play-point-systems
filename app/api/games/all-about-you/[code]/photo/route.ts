import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";

const BUCKET = "all-about-you-guest-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/heic", "heic"], ["image/heif", "heif"],
]);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function matches(expected: string, token: string) {
  const a = Buffer.from(hash(token), "hex"); const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code: rawCode } = await params;
    const code = rawCode.trim().toUpperCase();
    const form = await request.formData();
    const playerId = String(form.get("playerId") ?? "");
    const token = String(form.get("token") ?? "");
    const file = form.get("photo");
    if (!(file instanceof File)) throw new Error("Choose or take a photo first.");
    if (!TYPES.has(file.type)) throw new Error("Use a JPEG, PNG, WebP, HEIC, or HEIF photo.");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("Keep the photo under 5 MB.");

    const supabase = getSupabaseServerClient();
    const { data: row, error: readError } = await supabase.from("ppl_all_about_you_rooms").select("state,version").eq("code", code).maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!row) throw new Error("Room not found.");
    const state = row.state as any;
    const player = state.players?.find((candidate: any) => candidate.id === playerId);
    if (!player || !matches(player.tokenHash, token)) throw new Error("Invalid player session.");
    if (state.status !== "lobby" || state.hostPlayerId !== playerId) throw new Error("Only the host can add the Guest of Honor photo in the lobby.");

    const ext = TYPES.get(file.type)!;
    const path = `${code}/${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: "3600" });
    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const previousPath = typeof state.guestPhotoPath === "string" ? state.guestPhotoPath : null;
    state.guestPhotoUrl = publicData.publicUrl;
    state.guestPhotoPath = path;
    state.message = "Guest of Honor photo added. You can replace it before the game starts.";
    const { data: saved, error: saveError } = await supabase.from("ppl_all_about_you_rooms")
      .update({ state, version: row.version + 1, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86_400_000).toISOString() })
      .eq("code", code).eq("version", row.version).select("state").maybeSingle();
    if (saveError || !saved) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(saveError?.message || "The table changed. Try the photo again.");
    }
    if (previousPath && previousPath !== path) await supabase.storage.from(BUCKET).remove([previousPath]);
    return NextResponse.json({ state: saved.state });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to upload photo." }, { status: 400 });
  }
}

export const runtime = "nodejs";
