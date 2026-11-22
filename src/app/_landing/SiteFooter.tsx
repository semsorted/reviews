import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NAV_LINKS } from "@/lib/site";
import { PHOTOS } from "./content";
import { wrap } from "./sections";

export function SiteFooter() {
  return (
    <footer className={`${wrap} py-10 text-sm text-moss`}>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <Link href="/" aria-label="Semsorted home">
          <Logo />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center font-medium hover:text-ink">{link.label}</Link>
          ))}
        </nav>
      </div>
      <p className="mt-4 max-w-[70ch]">Semsorted is an independent service and is not affiliated with or endorsed by Google. Google is a trademark of Google LLC.</p>
      <details className="mt-3">
        <summary className="cursor-pointer py-2 font-medium">Photo credits</summary>
        <ul className="mt-1 space-y-1">
          {Object.values(PHOTOS).map((photo) => (
            <li key={photo.source}>
              <a href={photo.source} rel="noopener" className="underline">{photo.title}</a> by {photo.author},{" "}
              <a href={photo.licenseUrl} rel="noopener license" className="underline">{photo.license}</a>, via Wikimedia Commons
            </li>
          ))}
        </ul>
      </details>
    </footer>
  );
}
