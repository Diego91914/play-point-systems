import { GAME_PREVIEW_MANIFEST as manifest } from "@/lib/play-point-core/game-preview-catalog";
import { GameScreenshotImage } from "./GameScreenshotImage";

export function GameScreenshot({ gameId, detail = false }: { gameId: string; detail?: boolean }) {
  const capture = manifest.captures.find((item) => item.gameIds.includes(gameId));
  // Missing coverage is a build error, never silently replaced with generic art.
  if (!capture) throw new Error(`Missing authentic game screenshot: ${gameId}`);
  const file = [...capture.files].sort((a, b) => b.width - a.width)[0];
  if (!file) throw new Error(`Missing game screenshot rendition: ${gameId}`);
  return (
    <figure data-game-preview={gameId}>
      <GameScreenshotImage
        key={file.src}
        src={file.src}
        alt={capture.alt}
        width={file.width}
        height={file.height}
        detail={detail}
      />
      <figcaption className="mt-3 text-xs leading-5 text-white/65">
        {capture.label}
        {detail ? <span className="mt-1 block text-white/50">Captured {capture.capturedAt.slice(0, 10)} from the local game interface. Opening the game may require sign-in.</span> : null}
      </figcaption>
    </figure>
  );
}
