import { ContactSection, h2, PageIntro, ShopsSection, StepsSection, wrap } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "/how-semsorted-works",
  "How the Google Review QR Works",
  "See how a customer scans a Semsorted QR, taps a few chips, edits a draft, and posts an honest review on Google."
);

const SETUP = [
  { title: "WhatsApp par shop batao", text: "Shop ka naam, type aur Google review link bhej do." },
  { title: "Hum setup karte hain", text: "Admin panel se aapki shop, sahi chips aur QR ready hota hai." },
  { title: "QR counter par rakho", text: "Print karke counter ya bill desk par lagao. Customer ka flow shuru." },
];

export default function HowItWorksPage() {
  return (
    <main>
      <PageIntro title="QR se Google review tak" text="Customer ko na app chahiye, na login. Aapko bas ek QR counter par rakhna hai." />
      <StepsSection />
      <section aria-labelledby="setup-title" className="bg-mist">
        <div className={`${wrap} py-20 lg:py-28`}>
          <h2 id="setup-title" className={`${h2} max-w-[16ch]`}>Aapki shop ka setup</h2>
          <ol className="mt-12">
            {SETUP.map((step, index) => (
              <li key={step.title} className="grid gap-2 border-t border-line py-7 last:border-b lg:grid-cols-2 lg:gap-12">
                <h3 className="text-[1.75rem] font-semibold">{index + 1}. {step.title}</h3>
                <p className="max-w-[52ch] text-lg leading-relaxed text-moss">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <ShopsSection />
      <ContactSection />
    </main>
  );
}
