import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { canViewReportsAndFinance } from "@/lib/permissions";
import { VerifyEmailBanner } from "./VerifyEmailBanner";

const NAV = [
  { href: "/dashboard", label: "اليوم" },
  { href: "/dashboard/appointments", label: "المواعيد" },
  { href: "/dashboard/customers", label: "العميلات" },
  { href: "/dashboard/services", label: "الخدمات" },
  { href: "/dashboard/staff", label: "الموظفات" },
  { href: "/dashboard/ratings", label: "التقييمات" },
  { href: "/dashboard/reports", label: "التقارير" },
  { href: "/dashboard/branding", label: "مظهر الصالون" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const nav = canViewReportsAndFinance(user) ? NAV : NAV.filter((item) => item.href !== "/dashboard/reports");

  return (
    <div className="flex min-h-screen flex-1 bg-gradient-to-b from-brand-gold/[0.04] via-background to-background">
      <aside className="flex w-60 shrink-0 flex-col border-l border-brand-gold/15 bg-white/90 p-5 shadow-[4px_0_24px_-12px_rgba(168,71,105,0.15)] backdrop-blur-sm max-md:hidden">
        <Link href="/dashboard" aria-label="دلال" className="px-2">
          <Image src="/dala-logo-option-a.png" alt="دلال" width={140} height={90} className="h-auto w-24" priority />
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-foreground/70 transition-all duration-300 hover:bg-gradient-to-l hover:from-brand/10 hover:to-brand-gold/10 hover:text-brand hover:shadow-sm hover:-translate-y-px"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-brand/[0.05] to-brand-gold/[0.08] p-3.5">
          <p className="text-sm font-bold text-zinc-800">{user.tenant.name}</p>
          <p dir="ltr" className="mt-0.5 text-xs font-bold tracking-wide text-brand-gold">
            D{user.tenant.sequenceNumber}
          </p>
          <p dir="ltr" className="mt-1 text-xs text-foreground/45">
            {user.email}
          </p>
          <form action={logoutAction}>
            <button className="mt-3 w-full rounded-xl px-3 py-2 text-start text-sm font-semibold text-rose-600 transition-colors duration-200 hover:bg-rose-50">
              خروج
            </button>
          </form>
        </div>
      </aside>

      {/* شريط سفلي للجوال */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-brand-gold/15 bg-white/95 py-2 shadow-[0_-4px_24px_-12px_rgba(168,71,105,0.15)] backdrop-blur-sm md:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl px-2 py-1 text-xs font-semibold text-foreground/65 transition-colors duration-200 hover:text-brand">
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 overflow-x-hidden p-6 pb-24 md:p-10">
        {!user.emailVerifiedAt && (
          <Suspense fallback={null}>
            <VerifyEmailBanner email={user.email} />
          </Suspense>
        )}
        {children}
      </main>
    </div>
  );
}
