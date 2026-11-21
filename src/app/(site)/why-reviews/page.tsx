import { ContactSection, PageIntro, ProblemsSection, QuotesSection, StatsSection } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "/why-reviews",
  "Why Google Reviews Matter for Local Shops",
  "Why local shops need honest Google reviews, and why happy customers often leave without writing one."
);

export default function WhyReviewsPage() {
  return (
    <main>
      <PageIntro title="Achha kaam dikhna bhi chahiye" text="Naya customer aapki dukaan tak aane se pehle phone par aapka naam dekhta hai. Wahan aapke purane customers ki baat honi chahiye." />
      <div className="pt-10">
        <StatsSection />
      </div>
      <ProblemsSection />
      <QuotesSection />
      <ContactSection />
    </main>
  );
}
