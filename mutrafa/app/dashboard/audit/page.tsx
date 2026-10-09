import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { formatLocalDateTime } from "@/lib/time";
import { EmptyState, PageHeader, Card } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";

export const metadata: Metadata = { title: "سجل التدقيق" };

export default async function AuditPage() {
  const { user, salon, ctx } = await requireDashboardUser();
  if (!canUse(user, ctx, "audit.view")) return <UpgradeCard feature="audit.view" />;

  const logs = await db.auditLog.findMany({
    where: { salonId: salon.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="سجل التدقيق" subtitle="كل عملية حساسة: من فعلها، ومتى، وعلى أي عنصر (آخر 200)." />
      {logs.length === 0 ? (
        <EmptyState>لا توجد عمليات مسجّلة بعد.</EmptyState>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                <span><strong>{l.action}</strong> · {l.entityType}{l.entityId ? ` ${l.entityId.slice(-6)}` : ""}</span>
                <span className="text-zinc-500">{l.user?.name ?? "النظام"} · {formatLocalDateTime(l.createdAt, salon.timezone)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
