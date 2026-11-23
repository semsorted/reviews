import QRCode from "qrcode";

export interface GenerateQrOptions {
  url: string;
  width?: number;
  margin?: number;
}

// Brand colors can be too light to scan once printed, so QR modules stay near-black.
const color = { dark: "#111111", light: "#FFFFFF" };

/** Returns the payee name of a valid UPI pay link, or null if it cannot take a payment. */
export function upiPayee(value?: string): string | null {
  if (!value?.startsWith("upi://pay?") || !URL.canParse(value)) return null;
  const params = new URL(value).searchParams;
  return params.get("pa") ? (params.get("pn") ?? "") : null;
}

export async function generateQrPng({ url, width = 1024, margin = 2 }: GenerateQrOptions): Promise<string> {
  return QRCode.toDataURL(url, { width, margin, color, errorCorrectionLevel: "H" });
}

export async function generateQrSvg({ url, width = 1024, margin = 2 }: GenerateQrOptions): Promise<string> {
  return QRCode.toString(url, { type: "svg", width, margin, color, errorCorrectionLevel: "H" });
}
