import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/salons", label: "الصالونات" },
  { href: "/admin/overdue", label: "المتأخرات" },
  { href: "/admin/churn", label: "الاضطراب" },
  { href: "/admin/messages", label: "الرسائل" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-brand/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" aria-label="دلال" className="flex items-center gap-2">
              <Image src="/dala-logo-option-a.png" alt="دلال" width={100} height={64} className="h-auto w-16" priority />
              <span className="text-lg font-extrabold text-brand">لوحة المشرف</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-foreground/55 sm:block">{user.email}</p>
            <form action={logoutAction}>
              <button className="rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                خروج
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/65 transition hover:bg-secondary hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
