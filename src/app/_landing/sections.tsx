import Image from "next/image";
import QRCode from "qrcode";
import { Check, Plus, Star } from "lucide-react";
import { SHOP_TYPES } from "@/lib/reviews/catalog";
import { CONTACT, SITE_URL } from "@/lib/site";
import { PHOTOS } from "./content";
import { WhatsAppIcon } from "./WhatsAppIcon";

const BRIGHTLOCAL = "https://www.brightlocal.com/research/local-consumer-review-survey/";
const GOOGLE_RANKING = "https://support.google.com/business/answer/7091?hl=en";

export const h2 = "text-[clamp(2.25rem,4.6vw,3.75rem)] font-semibold";
export const wrap = "mx-auto max-w-[90rem] px-4 sm:px-8";

const STATS = [
  { value: "97%", label: "of consumers read reviews for local businesses" },
  { value: "71%", label: "use Google when checking business reviews" },
  { value: "41%", label: "always read reviews when looking for a business" },
];

const PROBLEMS = [
  { title: "Customer khush hai, par likhta nahi", text: "Counter par thank you bolkar nikal jata hai. Uski achhi baat Google tak kabhi nahi pahunchti." },
  { title: "“Kya likhun?” par review ruk jata hai", text: "Log help karna chahte hain, par khaali review box dekhkar page band kar dete hain." },
  { title: "Naya customer aapko dhoondh nahi pata", text: "Paas ke log phone par shops compare karte hain. Kam reviews me achhi dukaan bhi chhoot jati hai." },
];

const QUOTES = [
  { hindi: "जो दिखता है, वही बिकता है।", meaning: "What people can see is what they buy.", by: "Popular Hindi saying" },
  { hindi: "ऐसी वाणी बोलिए, मन का आपा खोय। औरन को शीतल करे, आपहु शीतल होय॥", meaning: "Speak words that bring others peace, and they will bring you peace too.", by: "Sant Kabir" },
];

const PROMISES = [
  "Customer apni rating khud chunta hai.",
  "Low rating ko bhi Google tak same raasta milta hai.",
  "Draft sirf customer ki chuni hui baaton se banta hai.",
  "Customer padhkar, edit karke, khud post karta hai.",
  "Hum fake reviews nahi likhte aur reviews ke badle reward nahi dete.",
];

export const FAQS = [
  { q: "Kya customer ko app download karna padega?", a: "Nahi. Phone camera se QR scan karte hi review page khul jata hai." },
  { q: "Agar customer khush nahi hai to?", a: "Usse bhi same page aur same Google button milta hai. Low rating ka draft tareef nahi karta." },
  { q: "Review kaun post karta hai?", a: "Customer khud apne Google account se post karta hai. Semsorted Google par kuch post nahi karta." },
  { q: "Kaunsi languages milti hain?", a: "English, Hindi aur Hinglish. Shop ke hisaab se language set hoti hai." },
  { q: "Kya Semsorted Google ka part hai?", a: "Nahi. Semsorted ek independent service hai aur Google se affiliated nahi hai." },
];

export const MORE_FAQS = [
  { q: "QR kaun banata hai?", a: "Semsorted admin panel se aapki shop ke liye QR banata hai. Website se koi bhi QR nahi bana sakta." },
  { q: "Kya chips meri shop ke hisaab se honge?", a: "Haan. Shop type ke hisaab se chips ready aate hain, aur unhe aapki shop ke liye badla ja sakta hai." },
  { q: "QR kahan lagana chahiye?", a: "Counter, bill desk ya table par, jahan customer aaram se phone nikalkar scan kar sake." },
  { q: "Kya reviews ki guarantee hai?", a: "Nahi. Review dena customer ki apni marzi hai. Hum bas uska raasta aasan karte hain." },
  { q: "Kya Semsorted kisi review ko hide kar sakta hai?", a: "Nahi. Review Google par customer ke account se jata hai, aur Semsorted use hide ya delete nahi kar sakta." },
];

export const siteQr = () => QRCode.toString(SITE_URL, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#202124", light: "#0000" } });

export function WhatsAppButton({ className, label }: { className: string; label: string }) {
  return (
    <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full px-7 text-lg font-semibold transition-colors ${className}`}>
      <WhatsAppIcon className="size-5" />
      {label}
    </a>
  );
}

export function PageIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className={`${wrap} pb-6 pt-14 lg:pt-24`}>
      <h1 className="max-w-[16ch] text-[clamp(3rem,6.6vw,5.75rem)] font-semibold leading-[1] tracking-[-0.035em]">{title}</h1>
      <p className="mt-6 max-w-[52ch] text-xl leading-relaxed text-moss">{text}</p>
    </div>
  );
}

export async function StepsSection() {
  const qr = await siteQr();
  return (
    <section id="kaise" aria-labelledby="kaise-title" className={`${wrap} scroll-mt-20 py-20 lg:py-28`}>
      <h2 id="kaise-title" className={`${h2} max-w-[16ch]`}>Teen steps. Customer ka kaam khatam.</h2>
      <ol className="mt-12 grid gap-4 lg:grid-cols-3">
        <li className="flex min-h-[27rem] flex-col rounded-[1.75rem] bg-g-blue-tint p-7">
          <div className="flex flex-1 items-center justify-center">
            <div aria-hidden className="w-44 rounded-2xl bg-white p-4 shadow-[0_12px_32px_-12px_rgb(26_115_232/0.35)] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
          </div>
          <h3 className="mt-6 text-3xl font-semibold">1. Scan</h3>
          <p className="mt-2 text-lg leading-snug text-moss">Customer phone camera se QR scan karta hai. No app, no login.</p>
        </li>
        <li className="flex min-h-[27rem] flex-col rounded-[1.75rem] bg-g-yellow-tint p-7">
          <div aria-hidden className="flex flex-1 flex-col items-center justify-center">
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="size-9 fill-g-yellow text-g-yellow" />)}</div>
            <div className="mt-5 flex max-w-64 flex-wrap justify-center gap-2 font-medium">
              {["Taste", "Service", "Clean", "Price"].map((chip, index) => (
                <span key={chip} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 ${index < 2 ? "border-g-blue bg-white text-g-blue" : "border-black/10 bg-white/60 text-moss"}`}>
                  {index < 2 && <Check className="size-4" strokeWidth={3} />}
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <h3 className="mt-6 text-3xl font-semibold">2. Tap</h3>
          <p className="mt-2 text-lg leading-snug text-moss">Stars aur 2 se 4 chips chunta hai. Draft usi second ban jata hai.</p>
        </li>
        <li className="flex min-h-[27rem] flex-col rounded-[1.75rem] bg-g-green-tint p-7">
          <div aria-hidden className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-64 rounded-2xl bg-white p-4 shadow-[0_12px_32px_-12px_rgb(24_128_56/0.35)]">
              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="size-4 fill-g-yellow text-g-yellow" />)}</div>
              <p className="mt-2 leading-snug">I liked the taste and service. Really happy with my visit.</p>
              <span className="mt-3 inline-flex rounded-full bg-g-blue px-4 py-1.5 text-sm font-semibold text-white">Post</span>
            </div>
          </div>
          <h3 className="mt-6 text-3xl font-semibold">3. Post</h3>
          <p className="mt-2 text-lg leading-snug text-moss">Apne words me edit karke, copy karke, khud Google par post karta hai.</p>
        </li>
      </ol>
    </section>
  );
}

export function StatsSection() {
  return (
    <section id="kyun" aria-labelledby="kyun-title" className="scroll-mt-20 bg-mist">
      <div className={`${wrap} grid gap-12 py-20 lg:grid-cols-2 lg:py-28`}>
        <div>
          <h2 id="kyun-title" className={`${h2} max-w-[15ch]`}>Log dukaan aane se pehle reviews padhte hain</h2>
          <p className="mt-6 max-w-[48ch] text-sm leading-relaxed text-moss">
            Source: <a href={BRIGHTLOCAL} rel="noopener" className="underline underline-offset-2 hover:text-g-blue">BrightLocal Local Consumer Review Survey 2026</a>, US consumers.{" "}
            <a href={GOOGLE_RANKING} rel="noopener" className="underline underline-offset-2 hover:text-g-blue">Google says</a> review count and ratings can help local ranking, and that nobody can pay for a better local ranking.
          </p>
        </div>
        <dl>
          {STATS.map((stat) => (
            <div key={stat.value} className="grid grid-cols-[7.5rem_1fr] items-center gap-4 border-t border-line py-6 last:border-b sm:grid-cols-[10.5rem_1fr]">
              <dd className="font-display text-[clamp(3rem,5.4vw,4.5rem)] font-semibold leading-none tracking-[-0.03em] text-g-blue">{stat.value}</dd>
              <dt className="text-lg leading-snug text-moss">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function ProblemsSection() {
  return (
    <section aria-labelledby="dikkat-title" className={`${wrap} py-20 lg:py-28`}>
      <h2 id="dikkat-title" className={`${h2} max-w-[17ch]`}>Achhi dukaan, phir bhi kam reviews. Kyun?</h2>
      <div className="mt-12">
        {PROBLEMS.map((problem) => (
          <div key={problem.title} className="grid gap-2 border-t border-line py-7 lg:grid-cols-2 lg:gap-12">
            <h3 className="text-[1.75rem] font-semibold">{problem.title}</h3>
            <p className="max-w-[52ch] text-lg leading-relaxed text-moss">{problem.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ShopsSection() {
  return (
    <section aria-labelledby="shops-title" className={`${wrap} grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28`}>
      <div>
        <h2 id="shops-title" className={h2}>Chai stall se clinic tak</h2>
        <p className="mt-5 max-w-[48ch] text-xl leading-relaxed text-moss">
          Sweet shop, salon, gym, hotel, car service aur coaching samet {SHOP_TYPES.length} business types ke liye chips pehle se ready hain.
        </p>
        <ul className="mt-8 space-y-3.5 text-lg">
          {PROMISES.map((promise) => (
            <li key={promise} className="flex gap-3">
              <Check aria-hidden className="mt-1 size-5 shrink-0 text-g-green" strokeWidth={2.5} />
              {promise}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative aspect-[5/4] overflow-hidden rounded-[1.75rem] bg-mist">
        <Image src={PHOTOS.sweets.src} alt={PHOTOS.sweets.alt} fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
      </div>
    </section>
  );
}

export function QuotesSection() {
  return (
    <section aria-labelledby="quotes-title" className="bg-g-yellow-tint">
      <div className={`${wrap} py-20 lg:py-28`}>
        <h2 id="quotes-title" className="sr-only">Purani baatein, aaj bhi sach</h2>
        <figure>
          <blockquote>
            <p lang="hi" className="max-w-[18ch] font-display text-[clamp(2.75rem,7vw,6.25rem)] font-semibold leading-[1.08]">बूँद-बूँद से घड़ा भरता है।</p>
            <p className="mt-5 max-w-[48ch] text-xl leading-relaxed text-moss">Drop by drop, the pot fills. A strong reputation is built one honest review at a time.</p>
          </blockquote>
          <figcaption className="mt-3 font-semibold">Hindi proverb</figcaption>
        </figure>
        <div className="mt-14 grid gap-10 border-t border-black/10 pt-10 md:grid-cols-2">
          {QUOTES.map((quote) => (
            <figure key={quote.by}>
              <blockquote>
                <p lang="hi" className="max-w-[30ch] font-display text-2xl font-medium leading-snug">{quote.hindi}</p>
                <p className="mt-2 max-w-[44ch] leading-relaxed text-moss">{quote.meaning}</p>
              </blockquote>
              <figcaption className="mt-2 font-semibold">{quote.by}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ items = FAQS, title = "Aapke sawaal" }: { items?: typeof FAQS; title?: string }) {
  return (
    <section id="sawaal" aria-labelledby="sawaal-title" className={`${wrap} grid scroll-mt-20 gap-10 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-28`}>
      <h2 id="sawaal-title" className={h2}>{title}</h2>
      <div>
        {items.map((faq) => (
          <details key={faq.q} className="group border-t border-line last:border-b">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-xl font-medium [&::-webkit-details-marker]:hidden">
              {faq.q}
              <Plus aria-hidden className="size-6 shrink-0 text-moss transition-transform group-open:rotate-45" />
            </summary>
            <p className="max-w-[60ch] pb-5 text-lg leading-relaxed text-moss">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ContactSection({ asPageTitle = false }: { asPageTitle?: boolean }) {
  const Heading = asPageTitle ? "h1" : "h2";
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-20 overflow-hidden bg-g-blue text-white">
      <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-24 -top-1/4 h-[150%] text-white/10">
        <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
      </svg>
      <div className={`${wrap} relative py-20 lg:py-28`}>
        <Heading id="contact-title" className="max-w-[15ch] text-[clamp(2.75rem,6.4vw,5.5rem)] font-semibold leading-[1]">Apni shop ka review QR banwana hai?</Heading>
        <p className="mt-6 max-w-[46ch] text-xl leading-relaxed text-white/90">WhatsApp par shop ka naam aur type bhej do. Hum chips aur QR ready kar denge.</p>
        <WhatsAppButton label="WhatsApp par message karein" className="mt-8 bg-white text-whatsapp hover:bg-g-green-tint" />
      </div>
    </section>
  );
}
