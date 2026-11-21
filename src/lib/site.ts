import type { Metadata } from "next";

export const SITE_URL = "https://semsorted.com";
export const SITE_NAME = "Semsorted";
export const SITE_TITLE = "Semsorted: Get More Honest Google Reviews with a QR Code";
export const SITE_DESCRIPTION =
  "Semsorted helps local shops in India collect honest Google reviews. Customers scan a QR code, choose a rating, edit a ready draft, and post it on Google.";

const WHATSAPP_MESSAGE = "Hi Semsorted, mujhe apni shop ke liye review QR chahiye.";

export const CONTACT = {
  whatsappHref: `https://wa.me/919001892417?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
};

/** New pages must not reuse a retired path, because those return 410 and are removed from Google. */
export const NAV_LINKS = [
  { href: "/how-semsorted-works", label: "How it works" },
  { href: "/why-reviews", label: "Why reviews" },
  { href: "/stories", label: "Stories" },
  { href: "/questions", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName: SITE_NAME, title, description, locale: "en_IN", images: "/opengraph-image" },
    twitter: { card: "summary_large_image", title, description, images: "/opengraph-image" },
  };
}

const RETIRED_PATH = /^\/(why-semsorted|universities|request|prices|how-it-works|faq)(\/.*)?$/;

/** Pages from the previous website. They return 410 so search engines drop them. */
export function isRetiredPath(pathname: string): boolean {
  return RETIRED_PATH.test(pathname);
}
