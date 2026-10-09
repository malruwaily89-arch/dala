import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { hasFeature } from "@/lib/plans";
import { assignableRoles, ROLE_LABEL } from "@/lib/permissions";
import { inviteUserAction, toggleUserAction } from "@/app/actions/team";
import { Badge, Banner, Card, Field, PageHeader, btnGhost, btnPrimary, inputCls, EmptyState } from "@/components/ui";
import { UpgradeCard } from "@/components/dashboard/upgrade";

export const metadata: Metadata = { title: "الفريق" };

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { error, ok } = await searchParams;
  if (!canUse(user, ctx, "team.manage")) return <EmptyState>إدارة الفريق للمالكة فقط.</EmptyState>;

  const users = await db.user.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: "asc" } });
  const roles = assignableRoles(hasFeature(ctx.entitlements, "roles"));
  const full = ctx.remaining.admins <= 0;

  return (
    <div>
      <PageHeader title="الفريق وصلاحيات الدخول" subtitle={`${ctx.usage.admins} من ${ctx.entitlements.admins} حساب إدارة نشط.`} />
      {error && <Banner>{error}</Banner>}
      {ok === "invited" && <Banner tone="success">تم إنشاء الحساب.</Banner>}

      <Card className="mb-8">
        <h2 className="mb-4 font-bold text-ink">إضافة مستخدم</h2>
        {full ? (
          <p className="text-sm text-zinc-700">بلغتِ حد حسابات الإدارة في باقتك. رقّي باقتك لإضافة المزيد.</p>
        ) : (
          <form action={inviteUserAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field label="الاسم" name="name" required />
            <Field label="البريد الإلكتروني" name="email" type="email" required />
            <Field label="كلمة مرور مؤقتة" name="password" type="password" required hint="8 أحرف على الأقل" />
            <Field label="الدور">
              <select name="role" defaultValue="OWNER" className={inputCls}>
                {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </Field>
            <div className="flex items-end"><button className={`${btnPrimary} w-full`}>إنشاء الحساب</button></div>
          </form>
        )}
        {!hasFeature(ctx.entitlements, "roles") && (
          <div className="mt-5"><UpgradeCard feature="roles" /></div>
        )}
      </Card>

      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id}>
            <Card className="flex flex-wrap items-center gap-4">
              <div className="min-w-56 flex-1">
                <p className="font-bold">{u.name} {u.id === user.id && <span className="text-xs text-zinc-500">(أنتِ)</span>}</p>
                <p dir="ltr" className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <Badge className="bg-brand-soft text-brand">{ROLE_LABEL[u.role]}</Badge>
              <Badge className={u.active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}>{u.active ? "نشط" : "معطّل"}</Badge>
              {u.id !== user.id && (
                <form action={toggleUserAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className={`${btnGhost} px-4 py-2 text-xs`}>{u.active ? "تعطيل" : "تفعيل"}</button>
                </form>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
