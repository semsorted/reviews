import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findStory, STORIES } from "@/app/_landing/content";
import { ContactSection } from "@/app/_landing/sections";
import { StoryReader } from "@/app/_landing/StoryReader";
import { pageMeta } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return STORIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = findStory(slug);
  if (!story) return {};
  return pageMeta(`/stories/${slug}`, story.text.hinglish.title, story.text.en.teaser);
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const story = findStory(slug);
  if (!story) notFound();
  const next = STORIES[(STORIES.indexOf(story) + 1) % STORIES.length];

  return (
    <main>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-8 lg:pt-16">
        <Link href="/stories" className="inline-flex min-h-11 items-center font-medium text-g-blue hover:underline">Sab kahaniyan</Link>
        <div className="mt-4">
          <StoryReader story={story} />
        </div>
        <Link href={`/stories/${next.slug}`} className="group mt-12 block border-t border-line pt-6">
          <span className="block text-moss">Agli kahani</span>
          <span className="block font-display text-[2rem] font-semibold leading-tight group-hover:text-g-blue">{next.text.hinglish.title}</span>
        </Link>
      </div>
      <ContactSection />
    </main>
  );
}
