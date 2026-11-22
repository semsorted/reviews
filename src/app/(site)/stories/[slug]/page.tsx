import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findStory, STORIES } from "@/app/_landing/content";
import { EndCta } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";
import { StoryExperience } from "./StoryExperience";

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
      <StoryExperience story={story} next={next} />
      <EndCta title="Aapki dukaan ki kahani bhi Google tak pahunche?" button="WhatsApp par baat karein" />
    </main>
  );
}
