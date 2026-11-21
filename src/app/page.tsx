import Link from "next/link";
import { Check, Star } from "lucide-react";

const STEPS = [
  ["Scan", "A customer scans the QR code at your counter. No app or login."],
  ["Tap", "They choose a rating and 2 to 4 things they noticed."],
  ["Post", "AI writes a draft. They edit it, copy it, and post it on Google."],
];

const PROMISES = [
  "Customers choose their own rating.",
  "Low ratings get the same path to Google.",
  "Drafts use only what the customer selected.",
  "Customers review the text and post it themselves.",
];

const SAMPLE_CHIPS = [
  ["Masala chai", true],
  ["Quick service", true],
  ["Fresh bakes", false],
  ["Good value", true],
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="mx-auto flex h-20 max-w-6xl items-center px-5">
        <span className="font-display text-xl font-bold tracking-tight">Review QR</span>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:pb-28 lg:pt-12">
          <div>
            <h1 className="max-w-[12ch] text-[clamp(3rem,8vw,5.75rem)] font-bold leading-[0.98]">
              Turn a counter scan into an honest review
            </h1>
            <p className="mt-6 max-w-[46ch] text-xl leading-relaxed text-moss">
              Customers tap what they noticed, get a clear draft, and post it on your Google profile in under a minute.
            </p>
          </div>

          <figure aria-label="Example of the customer review screen" className="mx-auto w-full max-w-[23rem]">
            <div className="flex gap-1" aria-hidden>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} strokeWidth={1.75} className={`size-9 ${star <= 4 ? "fill-marigold text-marigold" : "text-moss/50"}`} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2" aria-hidden>
              {SAMPLE_CHIPS.map(([label, picked]) => (
                <span
                  key={label}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 font-medium ${picked ? "border-pine bg-pine text-white" : "border-line bg-paper"}`}
                >
                  {picked && <Check className="size-4" strokeWidth={2.5} />}
                  {label}
                </span>
              ))}
            </div>
            <div className="slip mt-6 px-5 pt-4">
              <p className="font-display text-lg font-semibold">Your review</p>
              <div className="my-3 border-t border-dashed border-line" />
              <p className="pb-2 text-[1.05rem] leading-relaxed">
                The masala chai was good and the service was quick. Fair value for what I had.
              </p>
            </div>
            <figcaption className="mt-5 text-sm text-moss">Example draft from a 4-star rating and three chips</figcaption>
          </figure>
        </section>

        <section aria-labelledby="how-title" className="bg-paper">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <h2 id="how-title" className="text-4xl font-bold">
              Three steps for your customer
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map(([title, text], index) => (
                <li key={title} className="border-t-2 border-pine pt-4">
                  <p className="font-display text-2xl font-semibold">
                    {index + 1}. {title}
                  </p>
                  <p className="mt-2 max-w-[32ch] text-moss">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="honest-title" className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <h2 id="honest-title" className="max-w-[14ch] text-4xl font-bold">
            Built for reviews your shop can stand behind
          </h2>
          <ul className="space-y-4">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex gap-3 text-lg">
                <Check aria-hidden className="mt-1 size-5 shrink-0 text-pine" strokeWidth={2.5} />
                {promise}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-display font-bold">Review QR</span>
          <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-moss hover:text-ink">
            Admin sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
