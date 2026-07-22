import { ImageResponse } from "next/og";

export const alt = "Play Point Systems — games, experiences, and music built to bring people together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "radial-gradient(circle at 15% 10%, #183359 0%, #09111d 38%, #050912 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 84px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
          <div
            style={{
              alignItems: "center",
              background: "linear-gradient(145deg, #111827, #050912)",
              border: "3px solid #f4c96b",
              borderRadius: 22,
              display: "flex",
              fontSize: 34,
              fontWeight: 900,
              height: 82,
              justifyContent: "center",
              letterSpacing: "-2px",
              width: 82,
            }}
          >
            PP
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Play Point Systems</div>
            <div style={{ color: "#a8c7e8", fontSize: 18, letterSpacing: 3, marginTop: 8, textTransform: "uppercase" }}>
              Products · Live experiences · Music
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 960 }}>
          <div style={{ fontSize: 68, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05 }}>
            Games, experiences, and music built to bring people together.
          </div>
          <div style={{ color: "#b9d8f2", fontSize: 24, marginTop: 28 }}>playpointsystems.com</div>
        </div>
      </div>
    ),
    size
  );
}
