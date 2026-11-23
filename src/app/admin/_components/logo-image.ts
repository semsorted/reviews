const MAX_WIDTH = 720;
const MAX_HEIGHT = 360;
const MAX_LENGTH = 190_000;

/** Keeps the logo's shape and transparency, then shrinks it until it fits the database limit. */
export async function toLogoData(source: string): Promise<string> {
  const image = new Image();
  image.src = source;
  await image.decode();
  const [naturalWidth, naturalHeight] = [image.naturalWidth || 512, image.naturalHeight || 512];
  let scale = Math.min(MAX_WIDTH / naturalWidth, MAX_HEIGHT / naturalHeight, 1);
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext("2d")!;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.92);
    const data = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
    if (data.length <= MAX_LENGTH) return data;
    scale *= 0.75;
  }
  throw new Error("Logo too large");
}
