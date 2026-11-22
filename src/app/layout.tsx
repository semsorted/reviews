import type { Metadata, Viewport } from "next";
import { Anek_Devanagari, Mukta, Outfit } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const anek = Anek_Devanagari({
  subsets: ["latin", "devanagari"],
  variable: "--font-anek",
  display: "swap",
  preload: false,
});

const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
  preload: false,
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anek.variable} ${mukta.variable} ${outfit.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
