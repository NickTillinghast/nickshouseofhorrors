import { ImageResponse } from "next/og";
import { SITE_NAME } from "../lib/site";

// The preview image when a link is shared (Slack, iMessage, X, Facebook).
// Movie pages swap in their own poster instead
export const alt = `${SITE_NAME}: find your next horror movie`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "radial-gradient(circle at 50% 40%, #3a0000 0%, #0a0a0a 65%)",
        color: "#ededed",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          color: "#e03030",
          letterSpacing: -2,
          textShadow: "0 0 40px #b00000",
        }}
      >
        {SITE_NAME}
      </div>
      <div style={{ fontSize: 36, color: "#bbbbbb" }}>
        Horror movies by subgenre · Where to watch · Random picks
      </div>
    </div>,
    size,
  );
}
