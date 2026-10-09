import Link from "next/link";
import type { Metadata } from "next";
import { signupAction } from "@/app/actions/auth";
import { Banner, Field, btnPrimary, Card, inputCls } from "@/components/ui";
import { MarketingShell } from "@/components/marketing/shell";
import { PLANS, PLAN_CODES, TRIAL_DAYS, isPlanCode, type PlanCode } from "@/lib/plans";

export const metadata: Metadata = { title: "إنشاء حساب الصالون" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string }>;
}) {
  const { error, plan } = await searchParams;
  const selected: PlanCode = plan && isPlanCode(plan) ? plan : "INDIE";

  return (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="p-6 md:p-8">
          <p className="text-sm font-bold text-gold">تجربة مجانية {TRIAL_DAYS} يوماً — بدون بطاقة</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-brand">أنشئي حساب صالونك</h1>
          {error && <div className="mt-5"><Banner>{error}</Banner></div>}

          <form action={signupAction} className="mt-8 space-y-8">
            <fieldset className="space-y-4">
              <legend className="mb-3 text-base font-bold text-brand">١. بيانات الصالون</legend>
              <Field label="اسم الصالون" name="salonName" required placeholder="صالون لومينا" />
              <Field
                label="اسم الرابط"
                name="slug"
                required
                dir="ltr"
                placeholder="lumina"
                hint="سيكون رابط حجزك: mutrafa.d-alal.com/اسم-الرابط — أحرف إنجليزية صغيرة وأرقام وشرطة (3–30)"
              />
              <Field label="رقم واتساب الصالون" name="whatsapp" type="tel" required placeholder="05XXXXXXXX" hint="يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-3 text-base font-bold text-brand">٢. حساب المالكة</legend>
              <Field label="اسمك" name="ownerName" required />
              <Field label="البريد الإلكتروني" name="email" type="email" required />
              <Field label="كلمة المرور" name="password" type="password" required hint="8 أحرف على الأقل" />
              <Field label="الباقة">
                <select name="plan" defaultValue={selected} className={inputCls}>
                  {PLAN_CODES.map((code) => (
                    <option key={code} value={code}>
                      {PLANS[code].nameAr} — {PLANS[code].priceSar} ر.س / شهر
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            <label className="flex items-start gap-3 text-sm text-zinc-700">
              <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 accent-brand" />
              <span>
                أوافق على <Link href="/terms" className="font-bold text-brand">شروط الاستخدام</Link> و
                <Link href="/privacy" className="font-bold text-brand"> سياسة الخصوصية</Link>
              </span>
            </label>

            <button className={`${btnPrimary} w-full`}>أدخلي إلى لوحتك</button>
          </form>
        </Card>
      </div>
    </MarketingShell>
  );
}
