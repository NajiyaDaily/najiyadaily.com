import { ImageResponse } from "next/og";
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        background: "#052962",
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: "serif", fontSize: "80px", fontWeight: 900,
          display: "flex", alignItems: "baseline",
        }}>
          <span style={{ color: "#ffffff" }}>N</span>
          <span style={{ color: "#d4af37" }}>D</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
