import { SiteFooter } from "@/app/_landing/SiteFooter";
import { SiteNav } from "@/app/_landing/SiteNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-white text-ink">
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
