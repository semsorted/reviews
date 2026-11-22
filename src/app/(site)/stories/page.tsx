import Link from "next/link";
import { STORIES, TONES } from "@/app/_landing/content";
import { EndCta, h2, wrap } from "@/app/_landing/sections";
import { StoryBook } from "@/app/_landing/StoryBook";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "/stories",
  "Stories of Local Shops",
  "Five short fictional stories in Hinglish, Hindi and English about local shops, honest customers, and the reviews between them."
);

export default function StoriesPage() {
  return (
    <main>
      <div className={`${wrap} pb-10 pt-12 lg:pb-14 lg:pt-16`}>
        <h1 className="text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.96] tracking-[-0.04em]">Har dukaan ki ek kahani</h1>
        <p className="mt-5 max-w-[50ch] text-xl leading-relaxed text-moss">Scroll karo aur panne palto. Jo kahani pasand aaye, use poora padho.</p>
      </div>

      <StoryBook id="book" />

      <section aria-labelledby="shelf-title" className={`${wrap} py-20 lg:py-28`}>
        <h2 id="shelf-title" className={h2}>Kahaniyon ki shelf</h2>
        <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {STORIES.map((story, index) => {
            const text = story.text.hinglish;
            return (
              <li key={story.slug} className={index === STORIES.length - 1 ? "col-span-2 lg:col-span-1" : ""}>
                <Link href={`/stories/${story.slug}`} className={`group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-r-2xl rounded-l-md p-5 pl-7 shadow-[inset_10px_0_14px_-8px_rgb(0_0_0/0.4),0_16px_28px_-18px_rgb(6_24_56/0.7)] transition-transform hover:-translate-y-1.5 ${TONES[story.tone]} ${index === STORIES.length - 1 ? "max-lg:aspect-[3/2]" : ""}`}>
                  <span className="text-sm font-medium opacity-90">{text.trade}</span>
                  <span>
                    <span className="block font-display text-[clamp(1.6rem,2.3vw,2.25rem)] font-semibold leading-[1.05]">{text.title}</span>
                    <span className="mt-3 block text-sm font-semibold underline underline-offset-4">Poori kahani padho</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <EndCta title="Aapki dukaan ki kahani bhi Google tak pahunche?" button="WhatsApp par baat karein" />
    </main>
  );
}
