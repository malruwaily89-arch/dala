import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

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

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-l border-pink-100 bg-white p-4 max-md:hidden">
        <Link href="/dashboard" className="px-2 text-2xl font-extrabold text-brand">
          دلال
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-all duration-300 hover:bg-pink-50 hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-zinc-100 pt-4">
          <p className="px-2 text-sm font-bold">{user.tenant.name}</p>
          <p dir="ltr" className="px-2 text-xs text-zinc-400">
            {user.email}
          </p>
          <form action={logoutAction}>
            <button className="mt-2 w-full rounded-lg px-3 py-2 text-start text-sm font-semibold text-rose-600 hover:bg-rose-50">
              خروج
            </button>
          </form>
        </div>
      </aside>

      {/* شريط سفلي للجوال */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-zinc-200 bg-white py-2 md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="px-2 text-xs font-semibold text-zinc-600">
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 overflow-x-hidden p-6 pb-24 md:p-10">{children}</main>
    </div>
  );
}
