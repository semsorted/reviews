"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toLogoData } from "./logo-image";
import { adminRequest } from "./request";

interface Brand {
  primary: string;
  surface: string;
  accent: string;
}
type Found = { primary: string; surface: string | null; accent: string | null; logo: string | null; url: string };

const FIELDS = [
  { key: "primary", label: "Main" },
  { key: "surface", label: "Page" },
  { key: "accent", label: "Accent" },
] as const;

export function BrandPanel({ shopId, website, current, hasLogo }: { shopId: string; website: string; current: Brand; hasLogo: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState(website);
  const [colors, setColors] = useState(current);
  const [logo, setLogo] = useState<string | null>(null);
  const [useLogo, setUseLogo] = useState(!hasLogo);
  const [state, setState] = useState<"idle" | "reading" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const read = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setState("reading");
    const result = await adminRequest<{ brand: Found }>(`/api/admin/shops/${shopId}/brand`, "POST", { url });
    setState("idle");
    if (!result.ok) return setError(result.error);
    const { brand } = result.data;
    setUrl(brand.url);
    setColors((old) => ({ primary: brand.primary, surface: brand.surface ?? old.surface, accent: brand.accent ?? old.accent }));
    setLogo(brand.logo ? await toLogoData(brand.logo).catch(() => null) : null);
    setUseLogo(Boolean(brand.logo));
  };

  const apply = async () => {
    setError(null);
    setState("saving");
    const result = await adminRequest(`/api/admin/shops/${shopId}`, "PATCH", {
      websiteUrl: url.trim().startsWith("https://") ? url.trim() : "",
      primaryColor: colors.primary.toUpperCase(),
      surfaceColor: colors.surface.toUpperCase(),
      accentColor: colors.accent.toUpperCase(),
      ...(logo && useLogo ? { logoUrl: logo } : {}),
    });
    if (!result.ok) {
      setState("idle");
      return setError(result.error);
    }
    setLogo(null);
    setState("saved");
    router.refresh();
  };

  return (
    <section aria-labelledby="brand-title" className="rounded-2xl bg-paper p-4">
      <h2 id="brand-title" className="text-xl font-semibold">Poster brand</h2>
      <p className="mt-0.5 text-sm text-moss">Paste the business website to match its logo and colors.</p>

      <form onSubmit={read} className="mt-3">
        <Label htmlFor="brand-url">Website link</Label>
        <div className="flex gap-2">
          <Input id="brand-url" required inputMode="url" maxLength={2048} placeholder="https://business.com" value={url} onChange={(event) => { setUrl(event.target.value); setState("idle"); }} />
          <Button type="submit" variant="outline" isLoading={state === "reading"} className="shrink-0">
            <Globe aria-hidden className="size-4" /> Get brand
          </Button>
        </div>
      </form>

      {logo && (
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-line p-2.5">
          <input type="checkbox" checked={useLogo} onChange={(event) => setUseLogo(event.target.checked)} className="size-5 shrink-0 accent-[var(--color-g-blue)]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Logo found on the website" className="h-11 max-w-36 object-contain" />
          <span className="text-sm font-medium">Use this logo</span>
        </label>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="text-sm font-medium">
            {label}
            <input
              type="color"
              aria-label={`${label} color`}
              value={colors[key].toLowerCase()}
              onChange={(event) => { setColors({ ...colors, [key]: event.target.value }); setState("idle"); }}
              className="mt-1 block h-11 w-full cursor-pointer rounded-lg border border-line bg-paper p-1"
            />
          </label>
        ))}
      </div>

      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}
      {state === "saved" && !error && <p role="status" className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-g-green"><Check aria-hidden className="size-4" /> Poster updated</p>}
      <Button type="button" onClick={apply} isLoading={state === "saving"} className="mt-3 w-full">Apply to poster</Button>
    </section>
  );
}
