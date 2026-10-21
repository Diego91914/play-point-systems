import { PlayAmplifiedEventHubClient } from "./PlayAmplifiedEventHubClient";

export default async function PlayAmplifiedEventHubPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PlayAmplifiedEventHubClient code={code.toUpperCase()} />;
}
