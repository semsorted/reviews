"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Customer QR scan karta hai", text: "Phone ka normal camera kaafi hai. Na app, na login, na koi lamba form." },
  { title: "Apni rating khud deta hai", text: "1 star ho ya 5, raasta sabke liye same rehta hai. Hum kisi rating ko rokte nahi." },
  { title: "2 se 4 cheezein tap karta hai", text: "Chips aapki dukaan ke hisaab se hote hain. Bakery me cakes, salon me haircut, clinic me doctor." },
  { title: "Draft padhkar badal sakta hai", text: "Sirf chuni hui baaton se chhota draft banta hai. Customer use apne words me edit kar sakta hai." },
  { title: "Google par khud post karta hai", text: "Copy & Next dabate hi Google review page khulta hai. Customer paste karke apne account se post karta hai." },
];

const CHIPS = ["Cakes", "Freshness", "Service", "Price"];
const DRAFT = "I recently went to Sunrise Bakery. I liked the cakes and freshness. Overall, a great experience.";

function Stars({ size = "size-7" }: { size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn(size, "fill-review-star text-review-star")} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function ShopHeader() {
  return (
    <>
      <p className="text-lg font-medium">Sunrise Bakery</p>
      <p className="text-sm text-review-muted">Sample shop</p>
    </>
  );
}

function Screen({ step, qr }: { step: number; qr: string }) {
  if (step === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[2rem] bg-[#22262b] p-6 text-white">
        <div className="relative rounded-xl bg-white p-3">
          <span className="absolute -left-3 -top-3 size-8 rounded-tl-xl border-l-4 border-t-4 border-g-yellow" />
          <span className="absolute -right-3 -top-3 size-8 rounded-tr-xl border-r-4 border-t-4 border-g-yellow" />
          <span className="absolute -bottom-3 -left-3 size-8 rounded-bl-xl border-b-4 border-l-4 border-g-yellow" />
          <span className="absolute -bottom-3 -right-3 size-8 rounded-br-xl border-b-4 border-r-4 border-g-yellow" />
          <div className="w-36 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
        <p className="mt-8 text-center text-sm">Review page khul raha hai</p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col rounded-[2rem] bg-white px-5 pb-5 pt-10 text-review-ink">
      {step === 4 ? <p className="text-lg font-medium">Write a review</p> : <ShopHeader />}
      {step === 4 && <p className="text-sm text-review-muted">Google review page</p>}
      <div className="mt-5"><Stars /></div>
      {(step === 2 || step === 3) && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {CHIPS.map((chip, index) => (
            <span key={chip} className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium", index < 2 ? "border-review-tint bg-review-tint text-review-blue" : "border-review-line")}>
              {index < 2 && <Check className="size-3.5" strokeWidth={3} />}
              {chip}
            </span>
          ))}
        </div>
      )}
      {step === 1 && <p className="mt-5 text-sm text-review-muted">Tap a star to rate your visit.</p>}
      {step >= 3 && <p className={cn("mt-5 rounded-xl p-3 text-sm leading-snug", step === 4 ? "min-h-32 border border-review-blue" : "bg-mist")}>{DRAFT}</p>}
      <span className={cn("mt-auto flex min-h-11 items-center justify-center rounded-full text-sm font-medium text-white", step >= 3 ? "bg-review-blue" : "bg-review-line")}>
        {step === 4 ? "Post" : "Copy & Next"}
      </span>
    </div>
  );
}

function Phone({ children }: { children: ReactNode }) {
  return <div className="h-[31rem] w-[17.5rem] rounded-[2.5rem] bg-[#15171a] p-2 shadow-[0_28px_56px_-20px_rgb(6_24_56/0.55)]">{children}</div>;
}

export function HowPhone({ qr }: { qr: string }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(items.current.indexOf(entry.target as HTMLLIElement));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    items.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="Customer ka poora flow" className="mx-auto grid max-w-[90rem] gap-16 px-4 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <ol>
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            ref={(node) => {
              items.current[index] = node;
            }}
            className={cn("flex flex-col justify-center gap-8 py-10 transition-opacity lg:min-h-[78dvh] lg:py-0", index !== active && "lg:opacity-30")}
          >
            <div>
              <p className="font-display text-[clamp(3.5rem,7vw,6rem)] font-semibold leading-none text-g-blue">{index + 1}</p>
              <h2 className="mt-3 max-w-[15ch] text-[clamp(2.25rem,4.4vw,3.75rem)] font-semibold">{step.title}</h2>
              <p className="mt-4 max-w-[42ch] text-xl leading-relaxed text-moss">{step.text}</p>
            </div>
            <div aria-hidden className="flex justify-center lg:hidden">
              <Phone><Screen step={index} qr={qr} /></Phone>
            </div>
          </li>
        ))}
      </ol>
      <div aria-hidden className="hidden lg:block">
        <div className="sticky top-[calc(50dvh-13rem)] flex justify-center">
          <Phone><Screen step={active} qr={qr} /></Phone>
        </div>
      </div>
    </section>
  );
}
