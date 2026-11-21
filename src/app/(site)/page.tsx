import { chipsForShopType } from "@/lib/reviews/catalog";
import { pageMeta, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { ReviewDemo } from "@/app/_landing/ReviewDemo";
import { ContactSection, FaqSection, ProblemsSection, QuotesSection, ShopsSection, siteQr, StatsSection, StepsSection, WhatsAppButton } from "@/app/_landing/sections";
import { StoryBook } from "@/app/_landing/StoryBook";

export const metadata = { ...pageMeta("/", SITE_TITLE, SITE_DESCRIPTION), title: { absolute: SITE_TITLE } };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: ["en-IN", "hi-IN"], publisher: { "@id": `${SITE_URL}/#organization` } },
  ],
};

export default async function LandingPage() {
  const qr = await siteQr();

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="mx-auto grid max-w-[90rem] lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)]">
        <div className="flex flex-col justify-center px-4 pb-12 pt-10 sm:px-8 lg:py-16 lg:pr-14">
          <h1 className="max-w-[13ch] text-[clamp(3rem,6.6vw,6rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Aapka kaam bolta hai. Ab Google par bhi bolega.
          </h1>
          <p className="mt-6 max-w-[46ch] text-xl leading-relaxed text-moss">
            Counter par Semsorted ka QR rakho. Customer scan karta hai, 2 se 4 cheezein tap karta hai, aur apna honest review khud Google par post karta hai.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <WhatsAppButton label="WhatsApp par baat karein" className="bg-whatsapp text-white hover:bg-whatsapp-deep" />
            <a href="#kaise" className="inline-flex min-h-12 items-center text-lg font-semibold text-g-blue underline decoration-g-blue/30 underline-offset-[6px] hover:decoration-g-blue">
              See how it works
            </a>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden bg-g-blue px-4 py-12 lg:rounded-bl-[3rem] lg:py-8">
          <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-[18%] top-1/2 h-[135%] -translate-y-1/2 text-white/10">
            <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
          </svg>
          <div className="relative flex w-full items-center justify-center">
            <div aria-hidden className="absolute left-0 top-1/2 hidden w-40 -translate-y-1/2 -rotate-3 rounded-2xl bg-white p-4 shadow-xl 2xl:block">
              <div className="[&_svg]:block [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="mt-3 text-center font-display text-lg font-semibold leading-tight">Scan karke review do</p>
            </div>
            <ReviewDemo chips={chipsForShopType("Bakery").slice(0, 6)} />
          </div>
        </div>
      </section>

      <StepsSection />
      <StatsSection />
      <ProblemsSection />
      <StoryBook />
      <ShopsSection />
      <QuotesSection />
      <FaqSection />
      <ContactSection />
    </main>
  );
}
