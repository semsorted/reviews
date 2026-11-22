import { EndCta, wrap } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";
import { QuestionFinder } from "./QuestionFinder";

export const metadata = pageMeta(
  "/questions",
  "Questions About Semsorted",
  "Search answers about the Semsorted review QR, customer privacy on the review page, shop chips, languages, and Google reviews."
);

export default function QuestionsPage() {
  return (
    <main>
      <div className={`${wrap} grid gap-10 pb-20 pt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:pb-28 lg:pt-20`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h1 className="max-w-[10ch] text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.035em]">Seedhe sawaal, seedhe jawab</h1>
          <p className="mt-6 max-w-[34ch] text-xl leading-relaxed text-moss">Topic chuno ya apna sawaal type karo. Jawab turant yahin milega.</p>
        </div>
        <QuestionFinder />
      </div>
      <EndCta title="Aapka sawaal abhi bhi baaki hai?" button="WhatsApp par poochho" />
    </main>
  );
}
