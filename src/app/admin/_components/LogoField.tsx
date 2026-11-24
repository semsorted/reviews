"use client";

import { useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Check, ImagePlus, Palette, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BrandColors } from "@/lib/brand/extract";
import { cn } from "@/lib/utils";
import { contentBox, imagePalette, loadImage, logoPalette, sample, toLogoData, type Box } from "./logo-image";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_SIZE = 0.05;
const MODES = [
  { id: "logo", label: "Logo", text: "Crop the logo. Poster takes its background and colors." },
  { id: "reference", label: "Reference", text: "Only colors are used. Poster shows the name." },
] as const;
type Mode = (typeof MODES)[number]["id"];
type Handle = "drag" | "nw" | "ne" | "sw" | "se";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function moveBox(box: Box, handle: Handle, dx: number, dy: number): Box {
  if (handle === "drag") return { ...box, x: clamp(box.x + dx, 0, 1 - box.w), y: clamp(box.y + dy, 0, 1 - box.h) };
  let [left, top, right, bottom] = [box.x, box.y, box.x + box.w, box.y + box.h];
  if (handle.includes("w")) left = clamp(left + dx, 0, right - MIN_SIZE);
  if (handle.includes("e")) right = clamp(right + dx, left + MIN_SIZE, 1);
  if (handle.includes("n")) top = clamp(top + dy, 0, bottom - MIN_SIZE);
  if (handle.includes("s")) bottom = clamp(bottom + dy, top + MIN_SIZE, 1);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

function Cropper({ src, box, onBox }: { src: string; box: Box; onBox: (box: Box) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; x: number; y: number; start: Box } | null>(null);

  const begin = (event: PointerEvent<HTMLElement>) => {
    const handle = event.currentTarget.dataset.handle as Handle;
    event.preventDefault();
    event.stopPropagation();
    frame.current?.setPointerCapture(event.pointerId);
    drag.current = { handle, x: event.clientX, y: event.clientY, start: box };
  };
  const move = (event: PointerEvent) => {
    const current = drag.current;
    const rect = frame.current?.getBoundingClientRect();
    if (!current || !rect) return;
    onBox(moveBox(current.start, current.handle, (event.clientX - current.x) / rect.width, (event.clientY - current.y) / rect.height));
  };

  return (
    <div className="flex justify-center rounded-xl bg-mist p-2">
      <div ref={frame} onPointerMove={move} onPointerUp={() => (drag.current = null)} className="relative touch-none select-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Uploaded image" draggable={false} className="block max-h-80 max-w-full" />
        <div
          data-handle="drag"
          onPointerDown={begin}
          className="absolute cursor-move outline-2 outline-white shadow-[0_0_0_9999px_rgb(0_0_0/0.5)]"
          style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
        >
          {(["nw", "ne", "sw", "se"] as const).map((handle) => (
            <span
              key={handle}
              aria-hidden
              data-handle={handle}
              onPointerDown={begin}
              className={cn(
                "absolute size-6 rounded-full border-2 border-white bg-g-blue",
                handle[0] === "n" ? "-top-3" : "-bottom-3",
                handle[1] === "w" ? "-left-3" : "-right-3",
                handle === "nw" || handle === "se" ? "cursor-nwse-resize" : "cursor-nesw-resize",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LogoField({ value, onChange }: { value: string; onChange: (logo: string, colors: BrandColors | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("logo");
  const [crop, setCrop] = useState<{ image: HTMLImageElement; box: Box } | null>(null);
  const [reference, setReference] = useState<{ src: string; colors: BrandColors | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const isUpload = value.startsWith("data:");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setError("Choose a PNG, JPG or WebP image.");
    if (file.size > MAX_FILE_BYTES) return setError("Choose an image under 10 MB.");
    setIsReading(true);
    // The object URL stays alive while the crop is shown. One leaked URL per upload is fine for an admin page.
    const preview = URL.createObjectURL(file);
    try {
      const image = await loadImage(preview);
      if (mode === "logo") {
        setReference(null);
        setCrop({ image, box: contentBox(sample(image)) });
      } else {
        const colors = imagePalette(sample(image));
        setCrop(null);
        setReference({ src: await toLogoData(image), colors });
        onChange("", colors);
        if (!colors) setError("No clear brand colors in this image. Pick the color below or try another image.");
      }
    } catch {
      setError("This image could not be opened. Try another file.");
    } finally {
      setIsReading(false);
    }
  };

  const saveCrop = async () => {
    if (!crop) return;
    setIsReading(true);
    try {
      onChange(await toLogoData(crop.image, crop.box), logoPalette(sample(crop.image, crop.box)));
      setCrop(null);
    } catch {
      setError("This logo could not be saved. Try a smaller crop or another file.");
    } finally {
      setIsReading(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Logo or reference (optional)</p>
      <div role="radiogroup" aria-label="What is this image?" className="mb-2 grid grid-cols-2 gap-2">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={mode === item.id}
            onClick={() => { setMode(item.id); setCrop(null); }}
            className={cn("min-h-11 rounded-xl border p-2.5 text-left", mode === item.id ? "border-g-blue bg-g-blue/5" : "border-line bg-paper")}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="block text-xs text-moss">{item.text}</span>
          </button>
        ))}
      </div>

      {crop ? (
        <div className="space-y-2">
          <Cropper src={crop.image.src} box={crop.box} onBox={(box) => setCrop({ ...crop, box })} />
          <p className="text-sm text-moss">Drag the box so only the logo is inside.</p>
          <div className="flex gap-2">
            <Button type="button" onClick={saveCrop} isLoading={isReading} className="flex-1"><Check aria-hidden className="size-4" /> Use this logo</Button>
            <Button type="button" variant="ghost" onClick={() => setCrop(null)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-2.5">
          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-mist text-moss">
            {value || reference ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value || reference!.src} alt={value ? "Logo preview" : "Reference preview"} className="size-full bg-white object-contain p-1" />
            ) : (
              <ImagePlus aria-hidden className="size-5" />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label={`Upload ${mode} image`} onChange={upload} className="sr-only" tabIndex={-1} />
            <Button type="button" variant="outline" isLoading={isReading} onClick={() => inputRef.current?.click()}>
              {mode === "logo" ? <ImagePlus aria-hidden className="size-4" /> : <Palette aria-hidden className="size-4" />}
              {mode === "logo" ? (value ? "Change logo" : "Upload logo") : "Upload reference"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="icon" aria-label="Remove logo" className="text-moss" onClick={() => onChange("", null)}>
                <Trash2 aria-hidden className="size-4" />
              </Button>
            )}
            {!value && reference?.colors && (
              <span className="flex items-center gap-1 text-sm text-moss">
                {[reference.colors.primary, reference.colors.accent, reference.colors.surface].filter(Boolean).map((color) => (
                  <span key={color} className="size-5 rounded-full border border-line" style={{ backgroundColor: color! }} />
                ))}
                Colors set
              </span>
            )}
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-1.5 text-sm font-medium text-danger">{error}</p>}
      <details className="mt-2">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-g-blue">Use a logo link instead</summary>
        <Label htmlFor="logo" className="sr-only">Logo link</Label>
        <Input id="logo" type="url" placeholder="https://..." value={isUpload ? "" : value} onChange={(event) => onChange(event.target.value, null)} />
      </details>
    </div>
  );
}
