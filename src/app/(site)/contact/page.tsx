import { wrap } from "@/app/_landing/sections";
import { SHOP_TYPES } from "@/lib/reviews/catalog";
import { pageMeta } from "@/lib/site";
import { WhatsAppComposer } from "./WhatsAppComposer";

export const metadata = pageMeta("/contact", "Contact Semsorted on WhatsApp", "Add your shop details and send Semsorted a ready WhatsApp message to get a Google review QR set up.");

const NEXT = [
  { title: "Aap message bhejte ho", text: "Shop ki details WhatsApp par aa jati hain." },
  { title: "Hum details confirm karte hain", text: "Google review link aur language aapse pooch lete hain." },
  { title: "Aapka QR ready hota hai", text: "Hum aapki shop ke chips ke saath QR share karte hain." },
];

export default function ContactPage() {
  return (
    <main>
      <div className={`${wrap} pb-16 pt-14 lg:pb-24 lg:pt-20`}>
        <h1 className="max-w-[14ch] text-[clamp(3rem,6.6vw,6rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Teen details, ek WhatsApp</h1>
        <p className="mb-12 mt-6 max-w-[44ch] text-xl leading-relaxed text-moss">Neeche bharo. Aapka message khud ban jayega, bas bhejna hai.</p>
        <WhatsAppComposer shopTypes={SHOP_TYPES.map((type) => type.label)} />
      </div>

      <section aria-labelledby="next-title" className="bg-night text-white">
        <div className={`${wrap} py-16 lg:py-20`}>
          <h2 id="next-title" className="text-[clamp(2rem,3.6vw,3rem)] font-semibold">Message ke baad</h2>
          <ol className="mt-10 grid gap-8 lg:grid-cols-3">
            {NEXT.map((step, index) => (
              <li key={step.title} className="border-t border-white/25 pt-5">
                <h3 className="text-2xl font-semibold">{index + 1}. {step.title}</h3>
                <p className="mt-2 max-w-[34ch] text-lg leading-relaxed text-white/80">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
