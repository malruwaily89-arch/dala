import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/shell";
import { Card } from "@/components/ui";
import { TRIAL_DAYS } from "@/lib/plans";

export const metadata: Metadata = { title: "الأسئلة الشائعة" };

const FAQ = [
  { q: "هل تحتاجين بطاقة بنكية للتجربة؟", a: `لا. تبدئين تجربة مجانية لمدة ${TRIAL_DAYS} يوماً بميزات الذهبية، بدون بطاقة.` },
  { q: "ماذا يحدث بعد انتهاء التجربة؟", a: "تتوقف صفحة الحجز حتى تختارين باقة. بياناتك وخدماتك وعملاؤك تبقى محفوظة كما هي." },
  { q: "هل تأخذ مُترَفة عمولة على العربون؟", a: "لا. العربون يذهب مباشرة إلى حساب الصالون." },
  { q: "كيف يصل العربون؟", a: "تدفع العميلة عبر مدى أو فيزا أو ماستركارد أو Apple Pay أو Google Pay. ويتم تأكيد الموعد تلقائياً." },
  { q: "ماذا لو لم تدفع العميلة العربون؟", a: "يُحجز الموعد لمدة ساعتين، وبعدها يُحرَّر تلقائياً ليحجزه غيرها." },
  { q: "ما هي سياسة الإلغاء؟", a: "الإلغاء المجاني قبل الموعد بعدد ساعات يحدده الصالون. بعد هذه المهلة يُحتفظ بالعربون. الذهبية وما فوق تضبط سياسة مختلفة لكل خدمة." },
  { q: "هل يمكن تغيير الباقة لاحقاً؟", a: "نعم، من صفحة الفواتير. الترقية تفعّل الميزات الجديدة فور تأكيد الدفع." },
  { q: "هل التذكيرات تُرسل فعلياً؟", a: "نعم، من رقم واتساب الخاص بصالونك بعد ربط الرقم بمنصة Meta." },
];

export default function FaqPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-serif text-3xl font-bold text-brand">الأسئلة الشائعة</h1>
        <div className="mt-8 space-y-4">
          {FAQ.map((item) => (
            <Card key={item.q}>
              <h2 className="font-bold text-ink">{item.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">{item.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
