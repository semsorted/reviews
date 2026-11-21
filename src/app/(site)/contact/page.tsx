import { ContactSection } from "@/app/_landing/sections";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta("/contact", "Contact Semsorted on WhatsApp", "Message Semsorted on WhatsApp to get a Google review QR set up for your shop.");

export default function ContactPage() {
  return (
    <main>
      <ContactSection asPageTitle />
    </main>
  );
}
