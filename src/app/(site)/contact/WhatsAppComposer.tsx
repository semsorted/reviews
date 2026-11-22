"use client";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { WhatsAppIcon } from "@/app/_landing/WhatsAppIcon";
import { WHATSAPP_MESSAGE, whatsappLink } from "@/lib/site";

const field = "mt-2 h-14 w-full rounded-2xl border border-line bg-white px-4 text-lg outline-none focus:border-g-blue focus:ring-2 focus:ring-g-blue/20";

export function WhatsAppComposer({ shopTypes }: { shopTypes: string[] }) {
  const [shop, setShop] = useState("");
  const [type, setType] = useState("");
  const [city, setCity] = useState("");

  const details = [shop.trim() && `Shop: ${shop.trim()}`, type.trim() && `Type: ${type.trim()}`, city.trim() && `City: ${city.trim()}`].filter(Boolean);
  const message = [WHATSAPP_MESSAGE, ...details].join("\n");

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
      <form onSubmit={(event) => event.preventDefault()} className="space-y-5">
        <label className="block text-lg font-medium">
          Shop ka naam
          <input value={shop} onChange={(event) => setShop(event.target.value)} maxLength={80} autoComplete="organization" placeholder="Jaise Sunrise Bakery" className={`${field} font-normal`} />
        </label>
        <label className="block text-lg font-medium">
          Shop type
          <input value={type} onChange={(event) => setType(event.target.value)} maxLength={60} list="shop-types" placeholder="Jaise Bakery" className={`${field} font-normal`} />
          <datalist id="shop-types">
            {shopTypes.map((label) => <option key={label} value={label} />)}
          </datalist>
        </label>
        <label className="block text-lg font-medium">
          City
          <input value={city} onChange={(event) => setCity(event.target.value)} maxLength={60} autoComplete="address-level2" placeholder="Jaise Jaipur" className={`${field} font-normal`} />
        </label>
        <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-whatsapp px-7 text-lg font-semibold text-white transition-colors hover:bg-whatsapp-deep">
          <WhatsAppIcon className="size-5" />
          WhatsApp par bhejo
        </a>
        <p className="text-sm text-moss">Yeh details website par save nahi hoti. Button dabane par sirf aapke WhatsApp me message ready hota hai.</p>
      </form>

      <figure className="overflow-hidden rounded-[1.75rem] bg-[#efeae2]">
        <div className="flex items-center gap-3 bg-whatsapp-deep px-5 py-4 text-white">
          <span className="flex size-10 items-center justify-center rounded-full bg-white"><LogoMark className="size-7" /></span>
          <figcaption className="font-semibold">Aapka message</figcaption>
        </div>
        <div className="flex min-h-80 items-end justify-end p-5">
          <p aria-live="polite" className="max-w-[85%] whitespace-pre-line break-words rounded-2xl rounded-br-sm bg-[#d9fdd3] p-4 text-lg leading-snug text-ink shadow-sm">{message}</p>
        </div>
      </figure>
    </div>
  );
}
