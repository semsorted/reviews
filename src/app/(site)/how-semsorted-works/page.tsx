import { Check, X } from "lucide-react";
import { EndCta, h2, siteQr, wrap } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";
import { HowPhone } from "./HowPhone";

export const metadata = pageMeta(
  "/how-semsorted-works",
  "How the Google Review QR Works",
  "Follow one customer from QR scan to a posted Google review, and see what Semsorted sets up for your shop."
);

const SETUP = [
  { when: "Pehle", title: "Aap WhatsApp karte ho", text: "Shop ka naam, type aur city bhej do.", dot: "bg-g-blue" },
  { when: "Phir", title: "Hum shop set karte hain", text: "Admin panel me aapki shop, sahi chips, language aur Google review link lagta hai.", dot: "bg-g-red" },
  { when: "Uske baad", title: "QR aapke counter par", text: "Aapka QR print karke counter, bill desk ya table par rakh do.", dot: "bg-g-yellow" },
];

const WE_DO = ["Aapki dukaan ke hisaab se chips", "English, Hindi aur Hinglish draft", "Har rating ko Google tak same raasta", "Chips badlein to bhi wahi QR chalta rehta hai"];
const WE_NEVER = ["Customer ki jagah review post karna", "Low rating ko Google se chhupana", "Fake reviews likhna", "Review ke badle reward dena"];

export default async function HowItWorksPage() {
  const qr = await siteQr();

  return (
    <main>
      <div className={`${wrap} pb-6 pt-14 lg:pt-24`}>
        <h1 className="max-w-[13ch] text-[clamp(3rem,7.4vw,6.75rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Ek scan se Google review tak</h1>
        <p className="mt-6 max-w-[44ch] text-xl leading-relaxed text-moss">Neeche scroll karo. Ek customer ka poora raasta usi ke phone par dekho.</p>
      </div>

      <HowPhone qr={qr} />

      <section aria-labelledby="setup-title" className="bg-night text-white">
        <div className={`${wrap} py-20 lg:py-28`}>
          <h2 id="setup-title" className={`${h2} max-w-[16ch]`}>Aapko bas ek message karna hai</h2>
          <ol className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-0">
            {SETUP.map((step) => (
              <li key={step.title} className="relative border-l border-white/25 pl-7 lg:border-l-0 lg:border-t lg:pl-0 lg:pr-10 lg:pt-8">
                <span className={`absolute -left-2 top-1 size-4 rounded-full lg:-top-2 lg:left-0 ${step.dot}`} />
                <p className="text-white/70">{step.when}</p>
                <h3 className="mt-1 text-[1.9rem] font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-[34ch] text-lg leading-relaxed text-white/80">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="line-title" className={`${wrap} py-20 lg:py-28`}>
        <h2 id="line-title" className={`${h2} max-w-[18ch]`}>Hum kya karte hain, aur kya kabhi nahi</h2>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.75rem] bg-g-green-tint p-8 lg:p-10">
            <h3 className="text-3xl font-semibold">Hum karte hain</h3>
            <ul className="mt-6 space-y-4 text-lg">
              {WE_DO.map((item) => (
                <li key={item} className="flex gap-3"><Check aria-hidden className="mt-1 size-5 shrink-0 text-g-green" strokeWidth={2.5} />{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.75rem] bg-g-red-tint p-8 lg:p-10">
            <h3 className="text-3xl font-semibold">Hum kabhi nahi karte</h3>
            <ul className="mt-6 space-y-4 text-lg">
              {WE_NEVER.map((item) => (
                <li key={item} className="flex gap-3"><X aria-hidden className="mt-1 size-5 shrink-0 text-g-red" strokeWidth={2.5} />{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <EndCta title="Apni dukaan par yeh flow lagwana hai?" button="WhatsApp par shuru karein" />
    </main>
  );
}
