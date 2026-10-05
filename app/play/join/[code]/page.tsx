import { redirect } from "next/navigation";

export default async function ResolveRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/play/join?code=${encodeURIComponent(code.toUpperCase())}&lookup=1`);
}
