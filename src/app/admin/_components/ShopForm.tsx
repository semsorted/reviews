"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BrandColors } from "@/lib/brand/extract";
import { groupColor } from "@/lib/qr/poster";
import { chipsForShopType } from "@/lib/reviews/catalog";
import { MAX_ACTIVE_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";
import { BusinessTypePicker } from "./BusinessTypePicker";
import { ConfirmButton } from "./ConfirmButton";
import { GoogleLinkField, type LinkCheck } from "./GoogleLinkField";
import { LogoField } from "./LogoField";
import { adminRequest } from "./request";

export interface ShopFormValues {
  id?: string;
  name: string;
  businessCategory: string;
  googleReviewUrl: string;
  defaultLanguage: string;
  logoUrl: string;
  primaryColor: string;
  surfaceColor: string | null;
  accentColor: string | null;
  /** Whole rupees as typed. Left out for businesses that are not sold by QR, such as restaurants. */
  qrPrice?: string;
  isActive?: boolean;
}

const EMPTY: ShopFormValues = {
  name: "",
  businessCategory: "",
  googleReviewUrl: "",
  defaultLanguage: "en",
  logoUrl: "",
  primaryColor: "#1A73E8",
  surfaceColor: null,
  accentColor: null,
};

export function ShopForm({ shop, defaultPrice }: { shop?: ShopFormValues; defaultPrice?: number }) {
  const router = useRouter();
  const [values, setValues] = useState<ShopFormValues>(shop ?? { ...EMPTY, qrPrice: defaultPrice === undefined ? undefined : String(defaultPrice) });
  const [chips, setChips] = useState<string[]>([]);
  const [chipDraft, setChipDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [linkCheck, setLinkCheck] = useState<LinkCheck>("idle");
  const [savedLink, setSavedLink] = useState(shop?.googleReviewUrl ?? "");

  const setLogo = (logoUrl: string, colors: BrandColors | null) => {
    setSaved(false);
    setValues((current) => ({
      ...current,
      logoUrl,
      ...(colors ? { primaryColor: colors.primary, surfaceColor: colors.surface, accentColor: colors.accent } : {}),
    }));
  };

  const update = (key: keyof ShopFormValues, value: string) => {
    setSaved(false);
    setValues((current) => ({ ...current, [key]: value }));
  };

  const chooseShopType = (type: string) => {
    setSaved(false);
    setError(null);
    setValues((current) => ({ ...current, businessCategory: type, primaryColor: shop ? current.primaryColor : groupColor(type) }));
    if (!shop) setChips(chipsForShopType(type).slice(0, MAX_ACTIVE_CHIPS));
  };

  const addChip = () => {
    const label = chipDraft.trim();
    if (!label) return;
    if (chips.some((chip) => chip.toLowerCase() === label.toLowerCase())) {
      setError("That chip is already added.");
      return;
    }
    if (chips.length >= MAX_ACTIVE_CHIPS) {
      setError(`A business can have up to ${MAX_ACTIVE_CHIPS} chips.`);
      return;
    }
    setError(null);
    setChips([...chips, label]);
    setChipDraft("");
  };

  const onChipKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addChip();
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!shop && chips.length < MIN_CHIPS) {
      setError(`Add at least ${MIN_CHIPS} chips so customers have something to choose.`);
      return;
    }

    if (values.googleReviewUrl.trim() !== savedLink && linkCheck !== "correct") {
      setError("Tap Test link and confirm it opens the right Google review box.");
      document.getElementById("google")?.focus();
      return;
    }

    if (values.qrPrice !== undefined && !/^\d{1,7}$/.test(values.qrPrice)) {
      setError("Enter the price paid in whole rupees, for example 1999.");
      document.getElementById("qr-price")?.focus();
      return;
    }

    setIsSaving(true);
    const details = {
      name: values.name,
      businessCategory: values.businessCategory,
      googleReviewUrl: values.googleReviewUrl,
      defaultLanguage: values.defaultLanguage,
      logoUrl: values.logoUrl,
      primaryColor: values.primaryColor.toUpperCase(),
      surfaceColor: values.surfaceColor,
      accentColor: values.accentColor,
      ...(values.qrPrice !== undefined ? { qrPrice: Number(values.qrPrice) } : {}),
    };
    const result = shop
      ? await adminRequest(`/api/admin/shops/${shop.id}`, "PATCH", details)
      : await adminRequest<{ shop: { id: string; qrCodes: { id: string }[] } }>("/api/admin/shops", "POST", { ...details, chips });
    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (shop) {
      setSaved(true);
      setSavedLink(values.googleReviewUrl.trim());
      router.refresh();
    } else {
      const created = (result.data as { shop: { id: string; qrCodes: { id: string }[] } }).shop;
      router.push(`/admin/shops/${created.id}/qr/${created.qrCodes[0].id}`);
    }
  };

  const setActive = async (isActive: boolean) => {
    const result = await adminRequest(`/api/admin/shops/${shop!.id}`, "PATCH", { isActive });
    if (!result.ok) setError(result.error);
    else {
      setValues((current) => ({ ...current, isActive }));
      router.refresh();
    }
  };

  const deleteShop = async () => {
    const result = await adminRequest(`/api/admin/shops/${shop!.id}`, "DELETE");
    if (!result.ok) setError(result.error);
    else {
      router.push("/admin/shops");
      router.refresh();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="mb-1.5 font-medium">What kind of business?</p>
        <BusinessTypePicker value={values.businessCategory} onChoose={chooseShopType} />
      </div>

      {values.businessCategory && (
        <>
          <div>
            <Label htmlFor="name">{values.businessCategory} name</Label>
            <Input id="name" required minLength={2} maxLength={80} value={values.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <LogoField value={values.logoUrl} onChange={setLogo} />
          <GoogleLinkField
            value={values.googleReviewUrl}
            name={values.name}
            check={linkCheck}
            onChange={(url) => {
              update("googleReviewUrl", url);
              setLinkCheck("idle");
              setError(null);
            }}
            onCheck={(check) => {
              setLinkCheck(check);
              setError(null);
            }}
          />

          {values.qrPrice !== undefined && (
            <div>
              <Label htmlFor="qr-price">Price paid (₹)</Label>
              <Input id="qr-price" inputMode="numeric" maxLength={7} value={values.qrPrice} onChange={(e) => update("qrPrice", e.target.value.replace(/\D/g, ""))} />
              <p className="mt-1 text-sm text-moss">What this business paid after any coupon. It stays as you set it, even if the price in Settings changes later.</p>
            </div>
          )}

          {!shop && (
            <details className="rounded-xl border border-line bg-paper">
              <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 font-semibold">
                Customer chips <span className="text-sm font-medium text-moss">{chips.length} ready</span>
              </summary>
              <div className="border-t border-line p-4">
                <div className="flex gap-2">
                  <Input aria-label="Add a chip" maxLength={40} placeholder="Add a chip" value={chipDraft} onChange={(e) => setChipDraft(e.target.value)} onKeyDown={onChipKey} />
                  <Button type="button" variant="outline" onClick={addChip}>
                    Add
                  </Button>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <li key={chip} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-paper pl-4 pr-1 font-medium">
                      {chip}
                      <button
                        type="button"
                        aria-label={`Remove ${chip}`}
                        onClick={() => setChips(chips.filter((item) => item !== chip))}
                        className="flex size-9 items-center justify-center rounded-full text-moss hover:bg-ink/5"
                      >
                        <X aria-hidden className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          <details className="rounded-xl border border-line bg-paper">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold">Poster language and color</summary>
            <div className="space-y-4 border-t border-line p-4">
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <Label htmlFor="language">Poster language</Label>
                  <select
                    id="language"
                    value={values.defaultLanguage}
                    onChange={(e) => update("defaultLanguage", e.target.value)}
                    className="block min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <input
                    id="color"
                    type="color"
                    value={values.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="block h-11 w-16 cursor-pointer rounded-lg border border-line bg-paper p-1"
                  />
                </div>
              </div>
            </div>
          </details>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm font-medium text-pine">
          Changes saved
        </p>
      )}

      {values.businessCategory && (
        <Button type="submit" isLoading={isSaving} className="w-full">
          {shop ? "Save changes" : "Create and open QR poster"}
        </Button>
      )}

      {shop && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-5">
          <Button type="button" variant="outline" onClick={() => setActive(!values.isActive)}>
            {values.isActive ? "Pause business" : "Activate business"}
          </Button>
          <ConfirmButton
            variant="ghost"
            className="text-danger"
            title="Delete this business?"
            message="Its chips, QR codes, and review data will be deleted. Printed QR codes will stop working. This cannot be undone."
            confirmLabel="Delete business"
            onConfirm={deleteShop}
          >
            Delete business
          </ConfirmButton>
        </div>
      )}
    </form>
  );
}
