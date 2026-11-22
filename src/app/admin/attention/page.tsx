import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { isUuid } from "@/lib/admin/api";
import { ATTENTION_FILTERS, getAttention, parseAttentionFilter } from "@/lib/admin/attention";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { AttentionList, ShopFilter } from "../_components/AttentionList";
import { PageHead, Pager } from "../_components/TrackingBlocks";

export const metadata = { title: "Needs attention" };

const LABELS = { OPEN: "Open", RESOLVED: "Resolved", ALL: "All" };
type Search = { status?: string | string[]; shop?: string | string[]; page?: string | string[] };

export default async function AttentionPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminPage();
  const search = await searchParams;
  const status = parseAttentionFilter(search.status);
  const shopId = typeof search.shop === "string" && isUuid(search.shop) ? search.shop : undefined;
  const page = typeof search.page === "string" && /^[1-9]\d{0,5}$/.test(search.page) ? Number(search.page) : 1;
  const [data, shops] = await Promise.all([getAttention(status, page, shopId), prisma.shop.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  const counts = { OPEN: data.open, RESOLVED: data.resolved, ALL: data.open + data.resolved };
  const params = { status, ...(shopId ? { shop: shopId } : {}) };

  return (
    <div className="space-y-5">
      <PageHead title="Needs attention" text="1 and 2 star customers and their private messages. Only the admin can see these. Customers can still post on Google." />
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Issue status" className="inline-flex rounded-full bg-paper p-1">
          {ATTENTION_FILTERS.map((filter) => (
            <Link
              key={filter}
              href={{ pathname: "/admin/attention", query: { ...params, status: filter } }}
              aria-current={filter === status ? "page" : undefined}
              className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold", filter === status ? "bg-g-red text-white" : "text-moss hover:text-ink")}
            >
              {LABELS[filter]} <span className="tabular-nums opacity-80">{counts[filter]}</span>
            </Link>
          ))}
        </nav>
        <ShopFilter shops={shops} value={shopId ?? ""} status={status} />
      </div>
      {data.items.length ? (
        <>
          <AttentionList items={data.items} />
          <Pager base="/admin/attention" page={page} pages={data.pages} params={params} label="Issue pages" />
        </>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-g-green-tint p-6 font-medium text-g-green">
          <CircleCheck aria-hidden className="size-5" /> {status === "OPEN" ? "No open customer issues." : "Nothing to show here."}
        </p>
      )}
    </div>
  );
}
