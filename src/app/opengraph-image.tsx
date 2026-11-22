import { ImageResponse } from "next/og";
import { LOGO_STAR, WORDMARK } from "@/components/Logo";

export const alt = "Semsorted helps local shops get more honest Google reviews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#ffffff", color: "#202124" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 48, fontWeight: 700 }}>
          <svg width="76" height="76" viewBox="0 0 48 48" style={{ marginRight: 14 }}>
            <rect x="14" y="5" width="30" height="10" rx="5" fill="#1a56db" />
            <rect x="4" y="19" width="40" height="10" rx="5" fill="#12a150" />
            <rect x="4" y="33" width="24" height="10" rx="5" fill="#e5484d" />
            <polygon fill="#f5b301" points={LOGO_STAR} />
          </svg>
          {WORDMARK.map(([part, color]) => (
            <span key={part} style={{ color }}>{part}</span>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1000 }}>
          Honest Google reviews for your local shop
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#1a56db", fontWeight: 700 }}>semsorted.com</div>
      </div>
    ),
    size
  );
}
