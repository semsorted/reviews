import { ImageResponse } from "next/og";

export const alt = "Semsorted helps local shops get more honest Google reviews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#ffffff", color: "#202124" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 48, fontWeight: 700 }}>
          <svg width="76" height="76" viewBox="-2 -2 52 52" style={{ marginRight: 12 }}>
            <path fill="none" stroke="#1a73e8" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24" />
            <path fill="none" stroke="#34a853" strokeWidth="8.5" d="M24 24A10 10 0 1 1 14 34" />
            <circle cx="34" cy="14" r="4.25" fill="#ea4335" />
            <polygon fill="#fbbc04" points="14,27.4 15.78,31.54 20.28,31.96 16.89,34.94 17.88,39.34 14,37.04 10.12,39.34 11.11,34.94 7.72,31.96 12.22,31.54" />
          </svg>
          Semsorted
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1000 }}>
          Honest Google reviews for your local shop
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#1a73e8", fontWeight: 700 }}>semsorted.com</div>
      </div>
    ),
    size
  );
}
