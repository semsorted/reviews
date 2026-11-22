// ponytail: small logos live in shops.logo_url, so no storage bucket is needed. Move to storage if logos must be large.
export const MAX_LOGO_LENGTH = 200_000;

const LOGO_DATA = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export function isLogoImage(value: string): boolean {
  if (value.length > MAX_LOGO_LENGTH) return false;
  const match = LOGO_DATA.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], "base64");
  if (match[1] === "png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (match[1] === "jpeg") return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  return bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP";
}
