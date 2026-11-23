"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toLogoData } from "./logo-image";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function LogoField({ value, onChange }: { value: string; onChange: (logo: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
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
    const preview = URL.createObjectURL(file);
    try {
      onChange(await toLogoData(preview));
    } catch {
      setError("This image could not be opened. Try another file.");
    } finally {
      URL.revokeObjectURL(preview);
      setIsReading(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Logo (optional)</p>
      <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-2.5">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-mist text-moss">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo preview" className="size-full bg-white object-contain p-1" />
          ) : (
            <ImagePlus aria-hidden className="size-5" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload logo image" onChange={upload} className="sr-only" tabIndex={-1} />
          <Button type="button" variant="outline" isLoading={isReading} onClick={() => inputRef.current?.click()}>
            <ImagePlus aria-hidden className="size-4" /> {value ? "Change logo" : "Upload logo"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="icon" aria-label="Remove logo" className="text-moss" onClick={() => onChange("")}>
              <Trash2 aria-hidden className="size-4" />
            </Button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-1.5 text-sm font-medium text-danger">{error}</p>}
      <details className="mt-2">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-g-blue">Use a logo link instead</summary>
        <Label htmlFor="logo" className="sr-only">Logo link</Label>
        <Input id="logo" type="url" placeholder="https://..." value={isUpload ? "" : value} onChange={(event) => onChange(event.target.value)} />
      </details>
    </div>
  );
}
