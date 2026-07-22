import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(145deg, #111827, #050912)",
          border: "3px solid #f4c96b",
          borderRadius: 16,
          color: "#ffffff",
          display: "flex",
          fontSize: 26,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-2px",
          width: "100%",
        }}
      >
        PP
      </div>
    ),
    size
  );
}
