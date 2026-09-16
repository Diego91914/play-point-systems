import manifest from "@/lib/play-point-core/game-preview-manifest.json";
import { GameScreenshotImage } from "./GameScreenshotImage";

export function GameScreenshot({ gameId, detail = false }: { gameId: string; detail?: boolean }) {
  const capture = manifest.captures.find((item) => item.gameIds.includes(gameId));
  // Missing coverage is a build error, never silently replaced with generic art.
  if (!capture) throw new Error(`Missing authentic game screenshot: ${gameId}`);
  const src = capture.files.find((file) => file.width === 1280)?.src;
  if (!src) throw new Error(`Missing full-size game screenshot: ${gameId}`);
  return (
    <figure data-game-preview={gameId}>
      <GameScreenshotImage key={src} src={src} alt={capture.alt} height={capture.height} detail={detail} />
      <figcaption className="mt-3 text-xs leading-5 text-white/65">
        {capture.label}
        {detail ? <span className="mt-1 block text-white/50">Captured {capture.capturedAt.slice(0, 10)} from the local game interface. Opening the game may require sign-in.</span> : null}
      </figcaption>
    </figure>
  );
}
