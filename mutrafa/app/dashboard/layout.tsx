import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireDashboardUser } from "@/lib/guard";
import { canUse } from "@/lib/guard";
import { ACCESS_LABEL, ROLE_LABEL_SHORT } from "@/lib/labels";
import { Banner } from "@/components/ui";
import { bookingUrl } from "@/lib/env";
import { formatLocalDate } from "@/lib/time";

/** أيام متبقية في التجربة (تُحسب من الوقت الذي يُمرَّر، لا من داخل الرندر) */
function trialDaysRemaining(endsAt: Date, now: Date): number {
  return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000));
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, salon, ctx } = await requireDashboardUser();

  const nav = [
    { href: "/dashboard", label: "اليوم", show: true },
    { href: "/dashboard/appointments", label: "المواعيد", show: canUse(user, ctx, "appointments.manage") },
    { href: "/dashboard/customers", label: "العميلات", show: canUse(user, ctx, "customers.manage") },
    { href: "/dashboard/waitlist", label: "قائمة الانتظار", show: canUse(user, ctx, "waitlist.manage") && ctx.plan !== "INDIE" },
    { href: "/dashboard/services", label: "الخدمات", show: canUse(user, ctx, "services.manage") },
    { href: "/dashboard/calendars", label: "الموظفات", show: canUse(user, ctx, "calendars.manage") },
    { href: "/dashboard/reports", label: "التقارير", show: canUse(user, ctx, "reports.view") },
    { href: "/dashboard/closing", label: "الإغلاق اليومي", show: canUse(user, ctx, "reports.view") },
    { href: "/dashboard/team", label: "الفريق", show: canUse(user, ctx, "team.manage") },
    { href: "/dashboard/audit", label: "السجل", show: canUse(user, ctx, "audit.view") },
    { href: "/dashboard/billing", label: "الباقة والفواتير", show: canUse(user, ctx, "billing.manage") },
    { href: "/dashboard/settings", label: "إعدادات الصالون", show: canUse(user, ctx, "settings.manage") },
  ].filter((n) => n.show);

  const access = ACCESS_LABEL[ctx.access];
  const trialDaysLeft = ctx.trialEndsAt ? trialDaysRemaining(ctx.trialEndsAt, new Date()) : null;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-l border-brand/10 bg-white p-5 max-md:hidden">
        <Link href="/dashboard" className="font-serif text-2xl font-bold text-brand">مُترَفة</Link>
        <p className="mt-1 truncate text-sm font-semibold text-zinc-700">{salon.name}</p>
        <span className={`mt-2 w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ${access.tone}`}>{access.label}</span>

        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-brand-soft hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-zinc-100 pt-4 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-700">{user.name} · {ROLE_LABEL_SHORT[user.role]}</p>
          <a href={bookingUrl(salon.slug)} target="_blank" rel="noreferrer" className="mt-2 block truncate font-semibold text-brand" dir="ltr">
            {bookingUrl(salon.slug).replace(/^https?:\/\//, "")}
          </a>
          <form action={logoutAction}>
            <button className="mt-3 w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-rose-700 hover:bg-rose-50">خروج</button>
          </form>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-zinc-200 bg-white px-2 py-2 md:hidden">
        {nav.slice(0, 6).map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 px-3 text-xs font-semibold text-zinc-700">{item.label}</Link>
        ))}
      </nav>

      <main className="flex-1 overflow-x-hidden p-5 pb-24 md:p-10">
        {ctx.access === "trial" && trialDaysLeft !== null && (
          <Banner tone="info">
            أنتِ في الفترة التجريبية — متبقٍ {trialDaysLeft} يوماً (حتى {formatLocalDate(ctx.trialEndsAt!, salon.timezone)}). بعدها تتوقف صفحة الحجز حتى تختاري باقة.
          </Banner>
        )}
        {ctx.access === "trial_expired" && (
          <Banner>انتهت الفترة التجريبية، وصفحة الحجز متوقفة الآن. <Link href="/dashboard/billing" className="underline">اختاري باقتك</Link> لإعادة التفعيل.</Banner>
        )}
        {ctx.access === "past_due" && (
          <Banner>الاشتراك متأخر السداد. صفحة الحجز ما زالت مفتوحة، لكن يُرجى التجديد لتجنب الإيقاف. <Link href="/dashboard/billing" className="underline">تجديد الآن</Link></Banner>
        )}
        {ctx.access === "suspended" && <Banner>الحساب موقوف. تواصلي مع الدعم لإعادة التفعيل.</Banner>}
        {children}
      </main>
    </div>
  );
}
