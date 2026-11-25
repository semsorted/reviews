import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, ChartNoAxesColumn, IndianRupee, LayoutGrid, QrCode, ReceiptIndianRupee, Users } from "lucide-react";
import { BillSettings, OrderingSwitch, SetUpOrdering } from "@/components/ordering/manage/BillSettings";
import { CopyButton } from "@/components/ordering/manage/CopyButton";
import { MenuEditor } from "@/components/ordering/manage/MenuEditor";
import { StaffAccounts } from "@/components/ordering/manage/StaffAccounts";
import { TablesPanel } from "@/components/ordering/manage/TablesPanel";
import { SalesReport } from "@/components/ordering/SalesReport";
import { isUuid, publicAppUrl, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { menuFor, staffFor, tablesFor } from "@/lib/ordering/staff-page";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ChipManager } from "../../_components/ChipManager";
import { DeleteRestaurant } from "../../_components/DeleteRestaurant";
import { QrManager } from "../../_components/QrManager";
import { ShopForm } from "../../_components/ShopForm";
import { Panel } from "../../_components/TrackingBlocks";
import { PlanTab } from "./PlanTab";

export const metadata = { title: "Restaurant" };

const TABS = [
  { id: "menu", label: "Menu", icon: BookOpen },
  { id: "tables", label: "Tables and QR", icon: LayoutGrid },
  { id: "staff", label: "Staff", icon: Users },
  { id: "bill", label: "Bill", icon: ReceiptIndianRupee },
  { id: "sales", label: "Sales", icon: ChartNoAxesColumn },
  { id: "plan", label: "Plan and payment", icon: IndianRupee },
  { id: "review", label: "Review QR and details", icon: QrCode },
] as const;

export default async function RestaurantPage({ params, searchParams }: { params: Promise<{ shopId: string }>; searchParams: Promise<{ tab?: string | string[]; plan?: string | string[]; period?: string | string[] }> }) {
  await requireAdminPage();
  const { shopId } = await params;
  if (!isUuid(shopId)) notFound();
  const search = await searchParams;
  const tab = TABS.find((item) => item.id === search.tab)?.id ?? "menu";

  const [shop, settings] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, name: true, businessCategory: true } }),
    prisma.orderingSettings.findUnique({ where: { shopId }, select: { isEnabled: true, gstin: true, gstRateBp: true, fssai: true, upiUrl: true } }),
  ]);
  if (!shop) notFound();
  const base = `/admin/restaurants/${shop.id}`;
  const apiBase = `/api/admin/ordering/${shop.id}`;
  const loginUrl = publicAppUrl("/restaurant/login");

  const back = (
    <Link href="/admin/restaurants" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
      <ArrowLeft aria-hidden className="size-4" /> All restaurants
    </Link>
  );

  if (!settings) {
    return (
      <div className="space-y-5">
        {back}
        <Panel title={`Make ${shop.name} a restaurant`} className="max-w-2xl">
          <ul className="mb-5 list-disc space-y-1.5 pl-5 text-moss">
            <li>Guests scan the QR on their table, see the menu and order from their phone.</li>
            <li>The kitchen and waiters log in with their own accounts and see each order.</li>
            <li>Guests ask for the bill and pay by UPI or cash. The owner sees every bill.</li>
          </ul>
          <p className="mb-4 text-sm text-moss">Ordering stays off until you add the menu, tables and an owner login and turn it on.</p>
          <SetUpOrdering shopId={shop.id} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {back}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-moss">{shop.businessCategory}</p>
          <h1 className="mt-1 break-words text-[clamp(2.25rem,4vw,3rem)] font-semibold leading-none">{shop.name}</h1>
          <Link href={`${base}?tab=review`} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-pine hover:underline">
            <QrCode aria-hidden className="size-4" /> Review QR and poster
          </Link>
        </div>
        <OrderingSwitch shopId={shop.id} isEnabled={settings.isEnabled} />
      </header>

      <section aria-labelledby="login-page" className="rounded-2xl bg-paper p-4">
        <h2 id="login-page" className="text-sm font-semibold">Staff login page</h2>
        <p className="text-sm text-moss">The owner, manager, kitchen and waiters all log in here with their own account.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-mist px-3 py-2.5 text-sm">{loginUrl}</code>
          <CopyButton text={loginUrl} label="Copy staff login page link" />
        </div>
      </section>

      <nav aria-label="Restaurant sections" className="flex gap-1 overflow-x-auto rounded-full bg-paper p-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.id === "menu" ? base : `${base}?tab=${item.id}`}
              aria-current={tab === item.id ? "page" : undefined}
              className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold", tab === item.id ? "bg-night text-white" : "text-moss hover:text-ink")}
            >
              <Icon aria-hidden className="size-4" /> {item.label}
            </Link>
          );
        })}
      </nav>

      {tab === "menu" && <MenuEditor apiBase={apiBase} sections={await menuFor(shop.id)} />}
      {tab === "tables" && <TablesPanel apiBase={apiBase} printHref={`${base}/tables/print`} tables={await tablesFor(shop.id)} />}
      {tab === "staff" && <StaffAccounts apiBase={apiBase} accounts={await staffFor(shop.id)} />}
      {tab === "bill" && (
        <BillSettings saveUrl={apiBase} bill={{ gstin: settings.gstin ?? "", gstRateBp: settings.gstRateBp, fssai: settings.fssai ?? "", upiUrl: settings.upiUrl ?? "" }} />
      )}
      {tab === "sales" && <SalesReport shopId={shop.id} />}
      {tab === "plan" && <PlanTab shopId={shop.id} shopName={shop.name} query={search} />}
      {tab === "review" && <ReviewSection shopId={shop.id} />}

      <div className="border-t border-line pt-5"><DeleteRestaurant shopId={shop.id} name={shop.name} /></div>
    </div>
  );
}

/** The restaurant's Google review QR, chips and business details, so everything for one restaurant lives on this page. */
async function ReviewSection({ shopId }: { shopId: string }) {
  const shop = await prisma.shop.findUniqueOrThrow({
    where: { id: shopId },
    select: {
      id: true, name: true, businessCategory: true, googleReviewUrl: true, defaultLanguage: true, logoUrl: true, primaryColor: true, surfaceColor: true, accentColor: true, isActive: true,
      qrCodes: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, publicToken: true, scanCount: true, isActive: true } },
      chips: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, label: true, isActive: true } },
    },
  });
  return (
    <div className="grid gap-10 rounded-2xl bg-paper p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-6">
      <div className="min-w-0 space-y-10">
        <QrManager shopId={shop.id} qrCodes={shop.qrCodes.map((qr) => ({ id: qr.id, name: qr.name, url: publicQrUrl(qr.publicToken), scanCount: qr.scanCount, isActive: qr.isActive }))} />
        <ChipManager shopId={shop.id} shopType={shop.businessCategory} chips={shop.chips} />
      </div>
      <aside aria-labelledby="details-title">
        <h2 id="details-title" className="mb-4 text-2xl font-semibold">Restaurant details</h2>
        <ShopForm shop={{ ...shop, logoUrl: shop.logoUrl ?? "" }} />
      </aside>
    </div>
  );
}
