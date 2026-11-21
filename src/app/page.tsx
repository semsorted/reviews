import Image from "next/image";
import Link from "next/link";
import { Check, Mail, MessageCircle, MessageCircleQuestion, MousePointerClick, Phone, QrCode, SearchX, Send, Star, Store, UserRoundCheck } from "lucide-react";
import { CONTACT, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { SHOP_TYPES } from "@/lib/reviews/catalog";
import { PHOTOS } from "./_landing/content";
import { StoryTabs } from "./_landing/StoryTabs";

const BRIGHTLOCAL = "https://www.brightlocal.com/research/local-consumer-review-survey/";
const GOOGLE_RANKING = "https://support.google.com/business/answer/7091?hl=en";

const STATS = [
  { value: "97%", label: "of consumers read reviews for local businesses", color: "text-g-blue" },
  { value: "41%", label: "always read reviews when looking for a business", color: "text-g-red" },
  { value: "71%", label: "use Google when checking business reviews", color: "text-g-green" },
];

const PROBLEMS = [
  { icon: UserRoundCheck, title: "Customer khush hai, par likhta nahi", text: "Happy customers say thank you at the counter, then leave. Their good words never reach Google.", tint: "bg-g-red-tint text-g-red" },
  { icon: MessageCircleQuestion, title: "“Kya likhun?” par review ruk jata hai", text: "Most people want to help, but a blank review box makes them close the page.", tint: "bg-g-yellow-tint text-[#b06000]" },
  { icon: SearchX, title: "Naya customer aapko dhoondh nahi pata", text: "People nearby compare shops on their phone. With few reviews, a good shop is easy to miss.", tint: "bg-g-blue-tint text-g-blue" },
];

const STEPS = [
  { icon: QrCode, title: "Scan", text: "Customer counter par QR scan karta hai. No app, no login.", color: "bg-g-blue" },
  { icon: MousePointerClick, title: "Tap", text: "Stars aur 2 to 4 chips chunta hai. Review turant ban jata hai.", color: "bg-g-red" },
  { icon: Send, title: "Post", text: "Apne words me edit karke, copy karke, khud Google par post karta hai.", color: "bg-g-green" },
];

const QUOTES = [
  { hindi: "बूँद-बूँद से घड़ा भरता है।", meaning: "Drop by drop, the pot fills. A strong reputation is built one honest review at a time.", by: "Hindi proverb", border: "border-g-blue" },
  { hindi: "जो दिखता है, वही बिकता है।", meaning: "What people can see is what they buy. Good work also needs to be found.", by: "Popular Hindi saying", border: "border-g-yellow" },
  { hindi: "ऐसी वाणी बोलिए, मन का आपा खोय। औरन को शीतल करे, आपहु शीतल होय॥", meaning: "Speak words that bring others peace, and they will bring you peace too.", by: "Sant Kabir", border: "border-g-green" },
];

const PROMISES = [
  "Customer apni rating khud chunta hai.",
  "Low rating ko bhi Google tak same raasta milta hai.",
  "Draft sirf customer ki chuni hui baaton se banta hai.",
  "Customer padhkar, edit karke, khud post karta hai.",
  "Hum fake reviews nahi likhte aur reviews ke badle reward nahi dete.",
];

const FAQS = [
  { q: "Kya customer ko app download karna padega?", a: "Nahi. Phone camera se QR scan karte hi review page khul jata hai." },
  { q: "Agar customer khush nahi hai to?", a: "Usse bhi same page aur same Google button milta hai. Low rating ka draft tareef nahi karta." },
  { q: "Review kaun post karta hai?", a: "Customer khud apne Google account se post karta hai. Semsorted Google par kuch post nahi karta." },
  { q: "Kaunsi languages milti hain?", a: "English, Hindi aur Hinglish. Shop ke hisaab se language set hoti hai." },
  { q: "Kya Semsorted Google ka part hai?", a: "Nahi. Semsorted ek independent service hai aur Google se affiliated nahi hai." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.svg`, email: CONTACT.email, telephone: "+919001892417", contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: "+919001892417", email: CONTACT.email, areaServed: "IN", availableLanguage: ["English", "Hindi"] } },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: ["en-IN", "hi-IN"], publisher: { "@id": `${SITE_URL}/#organization` } },
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-g-blue">
            <Star className="size-5 fill-g-yellow text-g-yellow" />
          </span>
          {SITE_NAME}
        </Link>
        <nav aria-label="Page sections" className="hidden gap-6 text-sm font-semibold text-moss sm:flex">
          <a href="#kahani" className="hover:text-g-blue">Kahani</a>
          <a href="#kaise" className="hover:text-g-blue">How it works</a>
          <a href="#sawaal" className="hover:text-g-blue">FAQ</a>
        </nav>
        <a href="#contact" className="inline-flex min-h-11 items-center rounded-full bg-g-blue px-4 text-sm font-semibold text-white hover:bg-pine-deep">
          Contact us
        </a>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pb-24 lg:pt-10">
          <div>
            <p lang="hi" className="text-lg font-semibold text-g-blue">आपका काम अच्छा है। अब Google को भी पता चले।</p>
            <h1 className="mt-3 text-[clamp(2.6rem,6.5vw,4.75rem)] font-bold leading-[1.02]">
              Honest Google reviews for your local shop
            </h1>
            <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-moss">
              Customer khush hai, par review likhna bhool jata hai. Semsorted use ek QR scan aur do-teen taps ka kaam bana deta hai.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#contact" className="inline-flex min-h-12 items-center rounded-full bg-g-blue px-6 font-semibold text-white hover:bg-pine-deep">
                Apni shop ke liye baat karein
              </a>
              <a href="#kaise" className="inline-flex min-h-12 items-center rounded-full border border-line px-6 font-semibold text-g-blue hover:border-g-blue">
                See how it works
              </a>
            </div>
          </div>

          <figure className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
              <Image src={PHOTOS.shop.src} alt={PHOTOS.shop.alt} fill preload sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
            </div>
            <div aria-hidden className="relative -mt-16 ml-4 mr-4 rounded-xl border border-line bg-white p-4 shadow-lg sm:ml-auto sm:mr-5 sm:max-w-xs">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="size-5 fill-g-yellow text-g-yellow" />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-sm font-medium">
                {["Chai", "Service"].map((chip) => (
                  <span key={chip} className="inline-flex items-center gap-1 rounded-md bg-g-blue-tint px-2 py-1 text-g-blue">
                    <Check className="size-3.5" strokeWidth={3} />
                    {chip}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm leading-snug">I liked the chai and service. Really happy with my visit.</p>
            </div>
          </figure>
        </section>

        <section aria-labelledby="numbers-title" className="bg-mist">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 id="numbers-title" className="max-w-[24ch] text-3xl font-bold sm:text-4xl">Log dukaan jaane se pehle reviews padhte hain</h2>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.value}>
                  <dd className={`font-display text-6xl font-bold ${stat.color}`}>{stat.value}</dd>
                  <dt className="mt-2 max-w-[28ch] text-moss">{stat.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-8 max-w-3xl text-sm leading-relaxed text-moss">
              Source: <a href={BRIGHTLOCAL} rel="noopener" className="font-medium text-g-blue underline">BrightLocal Local Consumer Review Survey 2026</a>, US consumers.{" "}
              <a href={GOOGLE_RANKING} rel="noopener" className="font-medium text-g-blue underline">Google says</a> review count and ratings can help local ranking, and that nobody can pay for a better local ranking.
            </p>
          </div>
        </section>

        <section aria-labelledby="dikkat-title" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <h2 id="dikkat-title" className="text-3xl font-bold sm:text-4xl">Dikkat kahan hai?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {PROBLEMS.map(({ icon: Icon, title, text, tint }) => (
              <div key={title} className="rounded-2xl border border-line p-6">
                <span className={`flex size-11 items-center justify-center rounded-full ${tint}`}>
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-moss">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="kahani" aria-labelledby="kahani-title" className="scroll-mt-4 bg-g-yellow-tint">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:py-20">
            <div className="lg:sticky lg:top-6">
              <h2 id="kahani-title" className="text-3xl font-bold sm:text-4xl">Ek pyaari si kahani</h2>
              <p className="mt-2 text-moss">Har achhi dukaan ke peeche aisi hi ek kahani hoti hai.</p>
              <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-white">
                <Image src={PHOTOS.stall.src} alt={PHOTOS.stall.alt} fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" />
              </div>
            </div>
            <StoryTabs />
          </div>
        </section>

        <section id="kaise" aria-labelledby="kaise-title" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-16 lg:py-20">
          <h2 id="kaise-title" className="text-3xl font-bold sm:text-4xl">Sirf 3 steps</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text, color }, index) => (
              <li key={title}>
                <span className={`flex size-12 items-center justify-center rounded-full text-white ${color}`}>
                  <Icon aria-hidden className="size-6" />
                </span>
                <h3 className="mt-4 text-2xl font-semibold">{index + 1}. {title}</h3>
                <p className="mt-1 max-w-[34ch] leading-relaxed text-moss">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="quotes-title" className="bg-mist">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <h2 id="quotes-title" className="text-3xl font-bold sm:text-4xl">Purani baatein, aaj bhi sach</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {QUOTES.map((quote) => (
                <figure key={quote.by} className={`rounded-2xl border-l-4 bg-white p-6 ${quote.border}`}>
                  <blockquote>
                    <p lang="hi" className="text-xl font-semibold leading-snug">{quote.hindi}</p>
                    <p className="mt-3 leading-relaxed text-moss">{quote.meaning}</p>
                  </blockquote>
                  <figcaption className="mt-3 text-sm font-semibold text-ink">{quote.by}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="shops-title" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-20">
          <div className="grid grid-cols-2 gap-3">
            {[PHOTOS.sweets, PHOTOS.spices].map((photo) => (
              <div key={photo.src} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist">
                <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 270px, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div>
            <span className="flex size-11 items-center justify-center rounded-full bg-g-green-tint text-g-green">
              <Store aria-hidden className="size-5" />
            </span>
            <h2 id="shops-title" className="mt-4 text-3xl font-bold sm:text-4xl">Har local business ke liye</h2>
            <p className="mt-3 leading-relaxed text-moss">
              Chai stall, sweet shop, salon, clinic, gym, hotel, car service aur coaching samet {SHOP_TYPES.length} business types ke liye ready chips.
            </p>
            <ul className="mt-5 space-y-3">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex gap-3">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-g-green" strokeWidth={2.5} />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="sawaal" aria-labelledby="sawaal-title" className="scroll-mt-4 bg-g-blue-tint">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h2 id="sawaal-title" className="text-3xl font-bold sm:text-4xl">Aapke sawaal</h2>
            <div className="mt-6 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.q} className="rounded-xl bg-white px-5 py-4">
                  <summary className="cursor-pointer font-semibold">{faq.q}</summary>
                  <p className="mt-2 leading-relaxed text-moss">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="scroll-mt-4 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <h2 id="contact-title" className="max-w-[20ch] text-3xl font-bold sm:text-4xl">Apni shop ke liye review QR chahiye?</h2>
            <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-moss">
              Humein WhatsApp, call ya email karo. Hum aapki shop ke hisaab se chips aur QR ready kar denge.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center gap-3 rounded-xl bg-g-green px-5 py-3 font-semibold text-white hover:opacity-90">
                <MessageCircle aria-hidden className="size-6 shrink-0" />
                <span>WhatsApp<span className="block text-sm font-normal">{CONTACT.phone}</span></span>
              </a>
              <a href={CONTACT.phoneHref} className="flex min-h-16 items-center gap-3 rounded-xl bg-g-blue px-5 py-3 font-semibold text-white hover:bg-pine-deep">
                <Phone aria-hidden className="size-6 shrink-0" />
                <span>Call us<span className="block text-sm font-normal">{CONTACT.phone}</span></span>
              </a>
              <a href={CONTACT.emailHref} className="flex min-h-16 min-w-0 items-center gap-3 rounded-xl border border-line px-5 py-3 font-semibold text-ink hover:border-g-blue">
                <Mail aria-hidden className="size-6 shrink-0 text-g-red" />
                <span className="min-w-0">Email<span className="block truncate text-sm font-normal text-moss">{CONTACT.email}</span></span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl space-y-4 px-5 py-8 text-sm text-moss">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-base font-bold text-ink">{SITE_NAME}</span>
            <Link href="/login" className="inline-flex min-h-11 items-center font-semibold hover:text-g-blue">Admin sign in</Link>
          </div>
          <p>Semsorted is an independent service and is not affiliated with or endorsed by Google. Google is a trademark of Google LLC.</p>
          <details>
            <summary className="cursor-pointer font-semibold">Photo credits</summary>
            <ul className="mt-2 space-y-1">
              {Object.values(PHOTOS).map((photo) => (
                <li key={photo.source}>
                  <a href={photo.source} rel="noopener" className="underline">{photo.title}</a> by {photo.author},{" "}
                  <a href={photo.licenseUrl} rel="noopener license" className="underline">{photo.license}</a>, via Wikimedia Commons
                </li>
              ))}
            </ul>
          </details>
        </div>
      </footer>
    </div>
  );
}
