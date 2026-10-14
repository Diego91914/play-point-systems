import rawManifest from "./game-preview-manifest.json";

/**
 * Runtime-safe view of the static preview manifest.
 *
 * Clear the Stack was sourced from an authentic user-provided iPhone capture.
 * The legacy manifest named that file as a 1280 rendition even though the JPEG
 * itself is 320x320. Keep the raw capture record intact for provenance, but
 * expose truthful intrinsic dimensions to rendering and integrity checks until
 * the capture is replaced by the standard generated preview set.
 */
export const GAME_PREVIEW_MANIFEST = {
  ...rawManifest,
  captures: rawManifest.captures.map((capture) => {
    if (capture.id !== "clear-the-stack") return capture;
    return {
      ...capture,
      width: 320,
      height: 320,
      files: capture.files.map((file) => ({
        ...file,
        width: 320,
        height: 320,
      })),
    };
  }),
};
