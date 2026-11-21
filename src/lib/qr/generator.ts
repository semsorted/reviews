import QRCode from "qrcode";

export interface GenerateQrOptions {
  url: string;
  width?: number;
  margin?: number;
}

// Brand colors can be too light to scan once printed, so QR modules stay near-black.
const color = { dark: "#111111", light: "#FFFFFF" };

export async function generateQrPng({ url, width = 1024, margin = 2 }: GenerateQrOptions): Promise<string> {
  return QRCode.toDataURL(url, { width, margin, color, errorCorrectionLevel: "H" });
}

export async function generateQrSvg({ url, width = 1024, margin = 2 }: GenerateQrOptions): Promise<string> {
  return QRCode.toString(url, { type: "svg", width, margin, color, errorCorrectionLevel: "H" });
}
