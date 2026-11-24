"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton, PasswordInput } from "@/components/ordering/manage/CopyButton";
import { SHOP_TYPES } from "@/lib/reviews/catalog";
import { GoogleLinkField, type LinkCheck } from "../../_components/GoogleLinkField";
import { adminRequest } from "../../_components/request";

const STAYS = ["Hotel", "Resort", "Homestay", "Banquet and wedding hall"];
const TYPE_GROUPS = [
  { label: "Food and drink", types: SHOP_TYPES.filter((type) => type.group === "Food and drink").map((type) => type.label) },
  { label: "Stays and events", types: STAYS.filter((label) => SHOP_TYPES.some((type) => type.label === label)) },
];

export function NewRestaurantForm({ loginUrl }: { loginUrl: string }) {
  const [name, setName] = useState("");
  const [google, setGoogle] = useState("");
  const [linkCheck, setLinkCheck] = useState<LinkCheck>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; ownerLogin: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (linkCheck !== "correct") {
      setError("Tap Test link and confirm it opens the right Google review box.");
      document.getElementById("google")?.focus();
      return;
    }
    const data = new FormData(event.currentTarget);
    const ownerLogin = String(data.get("ownerLogin") ?? "").trim();
    setBusy(true);
    const result = await adminRequest<{ shop: { id: string } }>("/api/admin/restaurants", "POST", {
      name: name.trim(),
      businessCategory: String(data.get("businessCategory") ?? ""),
      googleReviewUrl: google.trim(),
      ownerName: String(data.get("ownerName") ?? "").trim(),
      ownerLogin,
      ownerPassword: String(data.get("ownerPassword") ?? ""),
    });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setCreated({ id: result.data.shop.id, ownerLogin });
  };

  if (created) {
    return (
      <section role="status" className="space-y-4 rounded-2xl bg-paper p-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Check aria-hidden className="size-5 text-g-green" /> {name.trim()} is ready</h2>
        <p className="text-moss">Send the owner the login page and their login. Tell them the password in person.</p>
        <div>
          <p className="text-sm font-semibold">Staff login page</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-mist px-3 py-2.5 text-sm">{loginUrl}</code>
            <CopyButton text={loginUrl} label="Copy login page link" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Owner login</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-mist px-3 py-2.5 text-sm">{created.ownerLogin}</code>
            <CopyButton text={created.ownerLogin} label="Copy owner login" />
          </div>
        </div>
        <Link href={`/admin/restaurants/${created.id}?tab=staff`} className={buttonVariants({ size: "lg" })}>Continue to staff, menu and tables</Link>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label htmlFor="name">Restaurant name</Label>
        <Input id="name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <select id="type" name="businessCategory" required defaultValue="" className="block min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base">
          <option value="" disabled>Pick a type</option>
          {TYPE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.types.map((type) => <option key={type} value={type}>{type}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <GoogleLinkField
        value={google}
        name={name}
        check={linkCheck}
        onChange={(url) => {
          setGoogle(url);
          setLinkCheck("idle");
          setError(null);
        }}
        onCheck={(check) => {
          setLinkCheck(check);
          setError(null);
        }}
      />

      <fieldset className="space-y-4 rounded-2xl border border-line bg-paper p-4">
        <legend className="px-1 font-semibold">Owner login</legend>
        <div>
          <Label htmlFor="owner-name">Owner name</Label>
          <Input id="owner-name" name="ownerName" required maxLength={60} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="owner-login">Login</Label>
          <Input id="owner-login" name="ownerLogin" required maxLength={140} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="98xxxxxxxx or balaji.owner" aria-describedby="owner-login-help" />
          <p id="owner-login-help" className="mt-1 text-sm text-moss">An email, a 10-digit mobile number, or a username like balaji.owner.</p>
        </div>
        <div>
          <Label htmlFor="owner-password">Password</Label>
          <PasswordInput id="owner-password" name="ownerPassword" required aria-describedby="owner-password-help" />
          <p id="owner-password-help" className="mt-1 text-sm text-moss">At least 8 characters. The owner can add more staff after logging in.</p>
        </div>
      </fieldset>

      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" size="lg" isLoading={busy}>Add restaurant</Button>
    </form>
  );
}
