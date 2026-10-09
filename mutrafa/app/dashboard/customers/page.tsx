import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { formatLocalDate } from "@/lib/time";
import { displayPhone } from "@/lib/phone";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "العميلات" };

export default async function CustomersPage() {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "customers.manage")) return <EmptyState>لا تملكين صلاحية عرض العميلات.</EmptyState>;

  const customers = await db.customer.findMany({
    where: { salonId: salon.id },
    include: { appointments: { select: { status: true, startsAt: true }, orderBy: { startsAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="العميلات" subtitle={`${customers.length} عميلة (آخر 200)`} />
      {customers.length === 0 ? (
        <EmptyState>لا عميلات بعد. تُضاف العميلة تلقائياً عند أول حجز.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => {
            const visits = c.appointments.filter((a) => a.status === "COMPLETED").length;
            const last = c.appointments[0];
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p dir="ltr" className="text-xs text-zinc-500">{displayPhone(c.phone)}</p>
                  </div>
                  {c.noShowCount > 0 && <Badge className="bg-rose-100 text-rose-800">{c.noShowCount} غياب</Badge>}
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  زيارات مكتملة: <strong>{visits}</strong>
                  {last && <> · آخر حجز: {formatLocalDate(last.startsAt, salon.timezone)}</>}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
