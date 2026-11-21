import { ImageResponse } from "next/og";

export const alt = "Semsorted helps local shops get more honest Google reviews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#ffffff", color: "#202124" }}>
        <div style={{ display: "flex", fontSize: 72, color: "#fbbc04", letterSpacing: 8 }}>★★★★★</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
          Honest Google reviews for your local shop
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 38, color: "#1a73e8", fontWeight: 700 }}>semsorted.com</div>
      </div>
    ),
    size
  );
}
