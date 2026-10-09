import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Banner, Field, btnPrimary, Card } from "@/components/ui";
import { MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <MarketingShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <h1 className="font-serif text-2xl font-bold text-brand">أهلاً بعودتك</h1>
          <p className="mt-1 text-sm text-zinc-600">سجّلي دخولك إلى لوحة صالونك.</p>
          {error && <div className="mt-4"><Banner>{error}</Banner></div>}
          <form action={loginAction} className="mt-6 space-y-4">
            <Field label="البريد الإلكتروني" name="email" type="email" required />
            <Field label="كلمة المرور" name="password" type="password" required />
            <button className={`${btnPrimary} w-full`}>دخول</button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-600">
            ليس لديك حساب؟ <Link href="/signup" className="font-bold text-brand">ابدئي تجربتك المجانية</Link>
          </p>
        </Card>
      </div>
    </MarketingShell>
  );
}
