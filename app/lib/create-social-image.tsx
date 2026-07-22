import { ImageResponse } from "next/og";

type SocialImageOptions = {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  secondaryAccent: string;
};

export const socialImageSize = { width: 1200, height: 630 };
export const socialImageContentType = "image/png";

export function createSocialImage({
  eyebrow,
  title,
  description,
  accent,
  secondaryAccent,
}: SocialImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#050912",
          color: "white",
          fontFamily: "Arial, sans-serif",
          padding: "68px 76px",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 999,
            right: -140,
            top: -220,
            background: accent,
            opacity: 0.24,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 440,
            height: 440,
            borderRadius: 999,
            left: -170,
            bottom: -270,
            background: secondaryAccent,
            opacity: 0.18,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 68,
                height: 68,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 18,
                border: "2px solid rgba(255,255,255,0.22)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 25,
                fontWeight: 900,
                color: "#f8d17c",
              }}
            >
              PP
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Play Point Systems</div>
              <div style={{ fontSize: 15, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                {eyebrow}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", maxWidth: 980 }}>
            <div style={{ fontSize: 68, lineHeight: 1.02, fontWeight: 900, letterSpacing: -3 }}>
              {title}
            </div>
            <div style={{ marginTop: 24, maxWidth: 900, fontSize: 25, lineHeight: 1.35, color: "rgba(255,255,255,0.76)" }}>
              {description}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 42 }}>
            <div style={{ width: 88, height: 6, borderRadius: 999, background: accent }} />
            <div style={{ width: 42, height: 6, borderRadius: 999, background: secondaryAccent }} />
            <div style={{ marginLeft: "auto", fontSize: 18, color: "rgba(255,255,255,0.58)" }}>playpointsystems.com</div>
          </div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
