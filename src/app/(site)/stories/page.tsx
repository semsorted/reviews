import Image from "next/image";
import Link from "next/link";
import { PHOTOS, STORIES } from "@/app/_landing/content";
import { ContactSection, h2, wrap } from "@/app/_landing/sections";
import { StoryBook } from "@/app/_landing/StoryBook";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "/stories",
  "Stories of Local Shops",
  "Short fictional stories in Hinglish, Hindi and English about local shops, honest customers, and the reviews between them."
);

export default function StoriesPage() {
  return (
    <main>
      <div className={`${wrap} grid items-center gap-10 pb-14 pt-14 lg:grid-cols-2 lg:gap-20 lg:pb-20 lg:pt-20`}>
        <div>
          <h1 className="max-w-[12ch] text-[clamp(3rem,6.6vw,5.75rem)] font-semibold leading-[1] tracking-[-0.035em]">Har dukaan ki ek kahani hoti hai</h1>
          <p className="mt-6 max-w-[46ch] text-xl leading-relaxed text-moss">Neeche scroll karo aur kitaab ke panne palto. Paanch chhoti kahaniyan, Hinglish, हिंदी aur English me.</p>
        </div>
        <div className="relative aspect-[3/2] overflow-hidden rounded-[1.75rem] bg-mist">
          <Image src={PHOTOS.chai.src} alt={PHOTOS.chai.alt} fill preload sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
        </div>
      </div>

      <StoryBook id="book" />

      <section aria-labelledby="all-title" className={`${wrap} py-20 lg:py-28`}>
        <h2 id="all-title" className={h2}>Sab kahaniyan</h2>
        <ul className="mt-10">
          {STORIES.map((story) => (
            <li key={story.slug} className="border-t border-line last:border-b">
              <Link href={`/stories/${story.slug}`} className="group grid gap-2 py-7 lg:grid-cols-2 lg:gap-12">
                <span>
                  <span className="block text-moss">{story.text.hinglish.trade}</span>
                  <span className="block font-display text-[1.9rem] font-semibold leading-tight group-hover:text-g-blue">{story.text.hinglish.title}</span>
                </span>
                <span className="max-w-[52ch] text-lg leading-relaxed text-moss">{story.text.hinglish.teaser}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ContactSection />
    </main>
  );
}
