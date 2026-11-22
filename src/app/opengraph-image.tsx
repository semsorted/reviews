import { ImageResponse } from "next/og";
import { WORDMARK } from "@/components/Logo";

export const alt = "Semsorted helps local shops get more honest Google reviews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#ffffff", color: "#202124" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 48, fontWeight: 700 }}>
          <svg width="76" height="76" viewBox="-2 -2 52 52" style={{ marginRight: 12 }}>
            <path fill="none" stroke="#ea4335" strokeWidth="8.5" d="M34 14A10 10 0 0 0 14 14" />
            <path fill="none" stroke="#fbbc05" strokeWidth="8.5" d="M14 14A10 10 0 0 0 24 24" />
            <path fill="none" stroke="#34a853" strokeWidth="8.5" d="M24 24A10 10 0 0 1 34 34" />
            <path fill="none" stroke="#4285f4" strokeWidth="8.5" d="M34 34A10 10 0 0 1 14 34" />
          </svg>
          {WORDMARK.map(([letter, color], index) => (
            <span key={index} style={{ color }}>{letter}</span>
          ))}
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
