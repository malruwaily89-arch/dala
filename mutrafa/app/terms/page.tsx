import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/shell";

export const metadata: Metadata = { title: "شروط الاستخدام" };

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="prose mx-auto max-w-3xl px-4 py-12 leading-relaxed">
        <h1 className="font-serif text-3xl font-bold text-brand">شروط الاستخدام</h1>
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          مسودة تشغيلية — يجب مراجعتها من مستشار قانوني قبل الإطلاق العام.
        </p>
        <h2 className="mt-8 text-xl font-bold">1. الخدمة</h2>
        <p>مُترَفة منصة لإدارة حجوزات صالونات التجميل وتحصيل العربون. يحق للمنصة تحديث الميزات مع إشعار مسبق.</p>
        <h2 className="mt-6 text-xl font-bold">2. الاشتراك والتجربة</h2>
        <p>التجربة المجانية مدتها 14 يوماً بميزات الذهبية. بعد انتهائها تتوقف صفحة الحجز حتى اختيار باقة.</p>
        <h2 className="mt-6 text-xl font-bold">3. العربون</h2>
        <p>العربون حق للصالون وفق سياسته المعلنة، ويُحتفظ به عند الإلغاء بعد المهلة المحددة.</p>
        <h2 className="mt-6 text-xl font-bold">4. مسؤولية الصالون</h2>
        <p>الصالون مسؤول عن دقة بيانات خدماته وموظفاته ورقم واتساب الخاص به.</p>
      </article>
    </MarketingShell>
  );
}
