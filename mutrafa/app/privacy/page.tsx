import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "سياسة الخصوصية" };

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
        <h1 className="font-serif text-3xl font-bold text-brand">سياسة الخصوصية</h1>
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          مسودة تشغيلية — يجب مراجعتها قانونياً لتتوافق مع نظام حماية البيانات الشخصية السعودي (PDPL) قبل الإطلاق.
        </p>
        <h2 className="mt-8 text-xl font-bold">البيانات التي نجمعها</h2>
        <p>اسم الصالون ورقم واتساب، بيانات المستخدمين، وبيانات العميلات (الاسم والجوال) التي يُدخلها الصالون أو تُدخلها العميلة عند الحجز.</p>
        <h2 className="mt-6 text-xl font-bold">استخدام البيانات</h2>
        <p>تُستخدم البيانات لتشغيل الحجوزات والتذكيرات والتقارير فقط، ولا تُباع لأي طرف ثالث.</p>
        <h2 className="mt-6 text-xl font-bold">الأمان</h2>
        <p>كلمات المرور مشفّرة بخوارزمية scrypt، والجلسات تُخزَّن بعد تجزئتها، ولا نحفظ بيانات البطاقات البنكية.</p>
      </article>
    </MarketingShell>
  );
}
