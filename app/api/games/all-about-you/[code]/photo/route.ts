import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import { actAllAboutYouRoom } from "@/lib/play-point-core/all-about-you-server";

const BUCKET = "all-about-you-guest-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const form = await request.formData();
    const playerId = String(form.get("playerId") ?? "");
    const token = String(form.get("token") ?? "");
    const file = form.get("photo");
    if (!(file instanceof File)) throw new Error("Choose or take a photo first.");
    if (!TYPES.has(file.type)) throw new Error("Use a JPEG, PNG, WebP, HEIC, or HEIF photo.");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("Keep the photo under 5 MB.");

    // Authenticate host + lobby state before accepting bytes. The engine also validates this on save.
    await actAllAboutYouRoom(code, playerId, token, "photo-check");

    const ext = TYPES.get(file.type)!;
    const path = `${code.toUpperCase()}/${randomUUID()}.${ext}`;
    const supabase = getSupabaseServerClient();
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: "3600" });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    try {
      const result = await actAllAboutYouRoom(code, playerId, token, "set-photo", { photoUrl: data.publicUrl, photoPath: path });
      return NextResponse.json(result);
    } catch (cause) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw cause;
    }
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to upload photo." }, { status: 400 });
  }
}

export const runtime = "nodejs";
