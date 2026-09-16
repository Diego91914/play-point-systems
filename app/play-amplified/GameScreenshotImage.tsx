"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useState } from "react";

// Pre-encoded WebP renditions; no runtime image/API dependency.
function previewLoader({ src, width }: ImageLoaderProps) {
  const rendition = width <= 480 ? 480 : width <= 800 ? 800 : 1280;
  return src.replace(/-1280\.webp$/, `-${rendition}.webp`);
}

export function GameScreenshotImage({ src, alt, height, detail }: { src: string; alt: string; height: number; detail: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-white/10 bg-[#05070b]">
      {failed ? (
        <p role="status" className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
          Screenshot unavailable. Use the game link to open the game.
        </p>
      ) : (
        <Image
          loader={previewLoader}
          src={src}
          alt={alt}
          width={1280}
          height={height}
          sizes={detail ? "(max-width: 1280px) calc(100vw - 32px), 1216px" : "(max-width: 639px) calc(100vw - 56px), (max-width: 1023px) 45vw, 384px"}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
