/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

const brandLogo = readFile(
  path.join(process.cwd(), "public", "images", "brand", "play-point-systems-logo.png"),
);

export const alt = "Play Point Systems — games, experiences, and music built to bring people together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = `data:image/png;base64,${(await brandLogo).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "radial-gradient(circle at 15% 10%, #362b19 0%, #0d0d0d 40%, #030303 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 84px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <img
            src={logo}
            alt=""
            width={560}
            height={140}
            style={{ objectFit: "contain" }}
          />
          <div style={{ color: "#d7b368", fontSize: 18, letterSpacing: 3, marginTop: 10, textTransform: "uppercase" }}>
            Products · Live experiences · Music
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 960 }}>
          <div style={{ fontSize: 68, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05 }}>
            Games, experiences, and music built to bring people together.
          </div>
          <div style={{ color: "#d8c08e", fontSize: 24, marginTop: 28 }}>playpointsystems.com</div>
        </div>
      </div>
    ),
    size
  );
}
