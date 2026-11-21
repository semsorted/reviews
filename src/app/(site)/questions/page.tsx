import { ContactSection, FaqSection, FAQS, MORE_FAQS, PageIntro } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "/questions",
  "Questions About Semsorted",
  "Answers about the Semsorted review QR, languages, chips, and how customers post their own reviews on Google."
);

export default function QuestionsPage() {
  return (
    <main>
      <PageIntro title="Seedhe sawaal, seedhe jawab" text="Shop owners aksar yeh poochte hain. Aapka sawaal yahan nahi hai to WhatsApp kar do." />
      <FaqSection title="Sab sawaal" items={[...FAQS, ...MORE_FAQS]} />
      <ContactSection />
    </main>
  );
}
