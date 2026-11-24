import { CoverStats, Panel } from "@/app/admin/_components/TrackingBlocks";
import { formatPaise } from "@/lib/ordering/bill";
import { formatBillNo, OPEN_STATUSES } from "@/lib/ordering/service";
import { prisma } from "@/lib/prisma";
import { indiaDayKey } from "@/lib/subscription";

const STATUS: Record<string, string> = { OPEN: "Ordering", BILL_REQUESTED: "Bill asked", PAID: "Paid", VOID: "Cancelled" };
const PAID_BY: Record<string, string> = { UPI: "UPI", CASH: "Cash" };
const DAY_MS = 86_400_000;
const when = (date: Date) => date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Paid totals for today, 7 and 30 days (India time), and the last 50 bills. Callers check access to shopId. */
export async function SalesReport({ shopId }: { shopId: string }) {
  const todayStart = new Date(`${indiaDayKey()}T00:00:00+05:30`);
  const windows = [
    { label: "Paid today", since: todayStart, note: "Since midnight", tone: "green" as const },
    { label: "Last 7 days", since: new Date(todayStart.getTime() - 6 * DAY_MS), note: "Including today", tone: "blue" as const },
    { label: "Last 30 days", since: new Date(todayStart.getTime() - 29 * DAY_MS), note: "Including today", tone: "deep" as const },
  ];
  const [totals, openNow, sessions] = await Promise.all([
    Promise.all(
      windows.map((window) =>
        prisma.tableSession.groupBy({ by: ["paidMethod"], where: { shopId, status: "PAID", paidAt: { gte: window.since } }, _count: { _all: true }, _sum: { totalPaise: true } })
      )
    ),
    prisma.tableSession.count({ where: { shopId, status: { in: OPEN_STATUSES } } }),
    prisma.tableSession.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, status: true, partySize: true, billFy: true, billNo: true, totalPaise: true, paidMethod: true, paidAt: true, createdAt: true, table: { select: { label: true } } },
    }),
  ]);

  const stats = windows.map((window, index) => {
    const rows = totals[index];
    const sum = (method?: string) => rows.filter((row) => !method || row.paidMethod === method).reduce((total, row) => total + (row._sum.totalPaise ?? 0), 0);
    const bills = rows.reduce((total, row) => total + row._count._all, 0);
    return {
      label: window.label,
      value: formatPaise(sum()),
      note: `${bills} ${bills === 1 ? "bill" : "bills"}. UPI ${formatPaise(sum("UPI"))}, cash ${formatPaise(sum("CASH"))}`,
      tone: window.tone,
    };
  });

  return (
    <div className="space-y-5">
      <CoverStats stats={[...stats, { label: "Open tables", value: openNow, note: "Ordering or waiting for the bill", tone: "yellow" }]} />
      <Panel title="Last 50 bills">
        {sessions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm tabular-nums [&_td]:px-3 [&_td:first-child]:pl-0 [&_th]:px-3 [&_th:first-child]:pl-0">
              <caption className="sr-only">Last 50 bills, newest first. Times are India time.</caption>
              <thead className="text-moss">
                <tr>
                  <th scope="col" className="pb-2 font-medium">Table</th>
                  <th scope="col" className="pb-2 font-medium">Status</th>
                  <th scope="col" className="pb-2 text-right font-medium">People</th>
                  <th scope="col" className="pb-2 font-medium">Bill number</th>
                  <th scope="col" className="pb-2 text-right font-medium">Total</th>
                  <th scope="col" className="pb-2 font-medium">Paid by</th>
                  <th scope="col" className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="py-2.5 font-semibold">{session.table.label}</td>
                    <td className="py-2.5">{STATUS[session.status] ?? session.status}</td>
                    <td className="py-2.5 text-right">{session.partySize}</td>
                    <td className="py-2.5">{formatBillNo(session) ?? "None yet"}</td>
                    <td className="py-2.5 text-right">{formatPaise(session.totalPaise)}</td>
                    <td className="py-2.5">{session.paidMethod ? (PAID_BY[session.paidMethod] ?? session.paidMethod) : ""}</td>
                    <td className="py-2.5">{when(session.paidAt ?? session.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-moss">No guests have ordered yet.</p>
        )}
      </Panel>
    </div>
  );
}
