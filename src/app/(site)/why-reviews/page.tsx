import { Star } from "lucide-react";
import { EndCta, h2, wrap } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";
import { ReviewMath } from "./ReviewMath";

export const metadata = pageMeta(
  "/why-reviews",
  "Why Google Reviews Matter for Local Shops",
  "How customers compare local shops on Google, what affects local ranking, and how to reply when a review is not five stars."
);

const BRIGHTLOCAL = "https://www.brightlocal.com/research/local-consumer-review-survey/";
const GOOGLE_RANKING = "https://support.google.com/business/answer/7091?hl=en";

const RESULTS = [
  { name: "Doosri dukaan", rating: "4.4", count: "318 reviews", you: false },
  { name: "Aapki dukaan", rating: "4.9", count: "9 reviews", you: true },
  { name: "Teesri dukaan", rating: "4.2", count: "146 reviews", you: false },
];

const FACTORS = [
  { title: "Relevance", text: "Aapki dukaan us search se kitni match karti hai. Sahi category aur details yahan kaam aati hain.", color: "text-g-blue", yours: "Business Profile se" },
  { title: "Distance", text: "Search karne wala aapse kitna door hai. Yeh aap badal nahi sakte.", color: "text-g-red", yours: "Aapke haath me nahi" },
  { title: "Prominence", text: "Aapki dukaan kitni jaani maani hai. Google ke mutabik review count aur rating yahan madad kar sakte hain.", color: "text-g-green", yours: "Yahan reviews kaam aate hain" },
];

const REPLIES = [
  { stars: 5, review: "Cake bahut fresh tha.", reply: "Shukriya! Agli baar aapke liye naya flavour ready rakhenge." },
  { stars: 3, review: "Khana achha tha, par wait zyada tha.", reply: "Batane ke liye shukriya. Rush ke time wait kam karne par kaam kar rahe hain." },
  { stars: 1, review: "Order galat mila.", reply: "Maaf kijiye, yeh hamari galti hai. Kripya counter par bataiye, hum ise theek karna chahte hain." },
];

export default function WhyReviewsPage() {
  return (
    <main>
      <section className={`${wrap} grid items-center gap-12 pb-16 pt-14 lg:grid-cols-2 lg:gap-20 lg:pb-24 lg:pt-20`}>
        <div>
          <h1 className="max-w-[12ch] text-[clamp(3rem,6.6vw,6rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Customer aapse pehle Google se milta hai</h1>
          <p className="mt-6 max-w-[44ch] text-xl leading-relaxed text-moss">Aapki rating achhi ho sakti hai. Par 9 reviews ke saamne 318 reviews wali dukaan zyada bharosemand lagti hai.</p>
        </div>
        <figure className="rounded-[1.75rem] bg-g-blue-tint p-4 sm:p-7">
          <div className="rounded-full bg-white px-5 py-3 text-moss shadow-sm">bakery near me</div>
          <ul className="mt-4 space-y-2.5">
            {RESULTS.map((shop) => (
              <li key={shop.name} className={`flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ${shop.you ? "outline-2 outline-g-blue" : ""}`}>
                <span>
                  <span className="block text-lg font-semibold">{shop.name}</span>
                  <span className="flex items-center gap-1 text-moss">
                    {shop.rating} <Star aria-hidden className="size-4 fill-g-yellow text-g-yellow" /> {shop.count}
                  </span>
                </span>
                {shop.you && <span className="shrink-0 rounded-full bg-g-blue px-3 py-1 text-sm font-semibold text-white">Aap</span>}
              </li>
            ))}
          </ul>
          <figcaption className="mt-3 text-sm text-moss">Sample search, sirf samjhane ke liye.</figcaption>
        </figure>
      </section>

      <section aria-labelledby="factors-title" className="bg-night text-white">
        <div className={`${wrap} py-20 lg:py-28`}>
          <h2 id="factors-title" className={`${h2} max-w-[16ch]`}>Google teen cheezein dekhta hai</h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            {FACTORS.map((factor) => (
              <div key={factor.title} className="border-t border-white/25 pt-6">
                <h3 className="text-4xl font-semibold">{factor.title}</h3>
                <p className="mt-3 max-w-[36ch] text-lg leading-relaxed text-white/80">{factor.text}</p>
                <p className="mt-4 font-semibold text-g-yellow">{factor.yours}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-white/70">
            Source: <a href={GOOGLE_RANKING} rel="noopener" className="underline underline-offset-2">Google Business Profile Help</a>. Koi bhi paise dekar local ranking nahi khareed sakta.
          </p>
        </div>
      </section>

      <section aria-labelledby="math-title" className={`${wrap} py-20 lg:py-28`}>
        <h2 id="math-title" className={`${h2} max-w-[17ch]`}>Aapki dukaan ka review hisaab</h2>
        <p className="mb-10 mt-4 max-w-[52ch] text-xl leading-relaxed text-moss">
          BrightLocal ke 2026 survey me 97% US consumers ne kaha ki woh local business ke reviews padhte hain. <a href={BRIGHTLOCAL} rel="noopener" className="text-base underline underline-offset-2">Survey dekho</a>
        </p>
        <ReviewMath />
      </section>

      <section aria-labelledby="reply-title" className="bg-g-yellow-tint">
        <div className={`${wrap} py-20 lg:py-28`}>
          <h2 id="reply-title" className={`${h2} max-w-[17ch]`}>Kam rating mile to ghabrana nahi</h2>
          <p className="mt-4 max-w-[50ch] text-xl leading-relaxed text-moss">Shaant aur seedha jawab naye customer ko dikhata hai ki aap apne kaam ki zimmedari lete ho.</p>
          <div className="mt-12 space-y-8">
            {REPLIES.map((item) => (
              <div key={item.stars} className="grid gap-3 lg:grid-cols-2">
                <div className="max-w-[34rem] rounded-2xl rounded-bl-sm bg-white p-5">
                  <div className="flex gap-0.5" role="img" aria-label={`${item.stars} star review`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} aria-hidden className={`size-4 ${star <= item.stars ? "fill-g-yellow text-g-yellow" : "fill-transparent text-line"}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-lg">{item.review}</p>
                </div>
                <div className="max-w-[34rem] justify-self-end rounded-2xl rounded-br-sm bg-g-blue p-5 text-white lg:justify-self-start">
                  <p className="text-sm text-white/80">Aapka jawab</p>
                  <p className="mt-1 text-lg">{item.reply}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EndCta title="Apni dukaan ke reviews shuru karein?" button="WhatsApp par baat karein" />
    </main>
  );
}
