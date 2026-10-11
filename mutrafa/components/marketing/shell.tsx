import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { btnPrimary } from "../ui";

export async function MarketingShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-brand/10 bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-serif text-2xl font-bold text-brand">
            مُترَفة
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-700 md:flex">
            <Link href="/#how" className="hover:text-brand">كيف تعمل</Link>
            <Link href="/#plans" className="hover:text-brand">الباقات</Link>
            <Link href="/faq" className="hover:text-brand">الأسئلة الشائعة</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className={btnPrimary}>لوحتي</Link>
            ) : (
              <>
                <Link href="/login" className="px-3 text-sm font-semibold text-brand">دخول</Link>
                <Link href="/signup" className={btnPrimary}>جرّبي 14 يوماً</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-brand/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-600">
          <p>© {new Date().getFullYear()} مُترَفة — جميع الحقوق محفوظة</p>
          <nav className="flex flex-wrap gap-5 font-semibold">
            <Link href="/faq" className="hover:text-brand">الأسئلة الشائعة</Link>
            <Link href="/terms" className="hover:text-brand">شروط الاستخدام</Link>
            <Link href="/privacy" className="hover:text-brand">سياسة الخصوصية</Link>
            <a href="mailto:hello@mutrafa.sa" className="hover:text-brand">تواصل معنا</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
