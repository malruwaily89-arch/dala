import Link from "next/link";
import { PrintButton } from "./print-button";

export const metadata = {
  title: "عرض مشروع — دلال للصالونات ذات الحركة الكثيفة",
};

export default function ProposalPage() {
  return (
    <main dir="rtl" className="flex-1 bg-zinc-100 print:bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10 print:py-0">
        {/* شريط الطباعة */}
        <div className="no-print mb-6 flex items-center justify-between">
          <Link href="/pricing" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800">
            ← رجوع إلى الأسعار
          </Link>
          <PrintButton />
        </div>

        {/* المستند */}
        <article className="rounded-[32px] border border-zinc-200 bg-white p-10 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none">
          {/* الترويسة */}
          <header className="flex items-start justify-between border-b-2 border-pink-100 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-brand">دلال</h1>
              <p className="mt-1 text-sm text-zinc-500">نظام إدارة مواعيد الصالونات</p>
            </div>
            <div className="text-left text-xs text-zinc-400">
              <p>عرض مشروع للمشاريع الكبيرة</p>
              <p>صالح 30 يوماً من تاريخ الإصدار</p>
            </div>
          </header>

          {/* العنوان */}
          <section className="mt-8">
            <h2 className="text-2xl font-extrabold leading-snug text-zinc-800">
              لصالونٍ تستقبل نحو 100 عميلة يومياً:
              <br />
              محتسباً ~110,000 ريال شهرياً كان يضيع عليك — بأقل من 1% ثمن.
            </h2>
          </section>

          {/* المشكلة */}
          <section className="mt-8">
            <h3 className="text-base font-extrabold text-zinc-800">١. أين تفقد الصالونات الكبيرة أموالها؟</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Problem n="~300 غياب شهرياً" d="10% من 3,000 موعد تأتي دون تنبيه أو عواقب — بكل ربع ساعة دوامهم وحالتهم المزدحمة." />
              <Problem n="تنسيق هاتفي هامشي" d="موظفة استقبال ترِد وتُرتّب وتُذكّر يدوياً — 7,000+ ريال راتب يُستهلك في عمل يقوم به النظام تلقائياً." />
              <Problem n="حجوزات متضاربة" d="قنوات متعددة متزامنة (واتساب، اتصال، زيارات) تُحجز نفس الدقيقة من نفس الموظفة مرتين." />
              <Problem n="مقدمات بلا ذاكرة" d="عرابون تُوَعَد شفوياً ولا تُحصَّل، وسجلات صبغات ومعالجات كل عميلة في ذاكرة موظفين يتنقلون." />
            </div>
          </section>

          {/* القيمة */}
          <section className="mt-8">
            <h3 className="text-base font-extrabold text-zinc-800">٢. القيمة الشهرية المحتسبة (بأرقام محافظة)</h3>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-pink-100 text-xs text-zinc-400">
                  <th className="p-2 text-right font-semibold">البند</th>
                  <th className="p-2 text-left font-semibold">القيمة/شهر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                <Row k="تقليل الغياب 10% (300 غياب × 300 ريال)" v="+90,000 ريال" />
                <Row k="توفير عمل موظفة تنسيق يدوي" v="+7,000 ريال" />
                <Row k="منع الحجوزات المزدوجة ووقت مهدور" v="+15,000 ريال" />
                <tr className="border-b-2 border-pink-100 font-extrabold text-brand">
                  <td className="p-2">الإجمالي</td>
                  <td className="p-2 text-left">~110,000 ريال</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* الحل */}
          <section className="mt-8">
            <h3 className="text-base font-extrabold text-zinc-800">٣. ماذا تحصل عليه؟</h3>
            <ul className="mt-4 grid gap-2.5 text-sm leading-6 text-zinc-700 sm:grid-cols-2">
              {[
                "صفحة حجز عامة بشعارك ولهويتك في بايو سناب شات وإنستغرام",
                "دورة عربون إلكتروني تمنع الغائبات والمهلة تلقائياً",
                "منع تعارض لكل موظفة على حدة (30 موظفة = 30 جدولاً مستقلاً)",
                "تأكيد وتذكير ومتابعة واتساب باسمك المعروف لدى عميلاتك",
                "قائمة انتظار: كل إلغاء يُعَرَض فوراً فلا يضيع أي ربع ساعة",
                "تقارير شهرية: إيراد، حضور، نسب إشغال، إيراد كل خدمة",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </section>

          {/* السعر */}
          <section className="mt-8 rounded-[24px] border-2 border-pink-100 bg-pink-50/60 p-6 text-center print:border-pink-200">
            <p className="text-sm text-zinc-500">باقة الاحترافية للمشاريع الكبيرة</p>
            <p className="mt-2">
              <span className="text-4xl font-extrabold text-brand">999 ريال</span>
              <span className="text-zinc-400"> / شهرياً</span>
            </p>
            <p className="mt-1 text-xs text-zinc-400">أو 9,990 ريال سنوياً (شهران مجاناً) — بدون رسوم تثبيت</p>
            <p className="mt-3 text-sm font-bold text-zinc-700">
              = أقل من 1% من القيمة المحتسبة، وثمن ضياع غياب واحد يومياً
            </p>
          </section>

          {/* باقة برو للمشاريع الكبيرة */}
          <section className="mt-6 rounded-[24px] border-2 border-amber-300 bg-gradient-to-l from-amber-50 to-purple-50 p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-purple-800">
              الاحترافية برو
              <span className="rounded-full bg-gradient-to-l from-amber-400 to-purple-500 px-3 py-0.5 text-xs font-bold text-white">
                برو ✨
              </span>
            </p>
            <p className="mt-2">
              <span className="text-4xl font-extrabold text-amber-600">1,299 ريال</span>
              <span className="text-zinc-400"> / شهرياً</span>
            </p>
            <p className="mt-1 text-xs text-zinc-400">أو 12,990 ريال سنوياً (شهران مجاناً)</p>
            <ul className="mx-auto mt-4 grid max-w-md gap-2 text-start text-sm leading-6 text-zinc-700">
              {[
                "كل ميزات الاحترافية",
                "تقارير متقدمة: مقارنة شهرية، ذروة الأيام والساعات، معدلات التحصيل والإلغاء",
                "تقييم كل موظفة وكل خدمة على حدة، وتحديد الأعلى والأحوج للتحسين تلقائياً",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </section>

          {/* المقارنة */}
          <section className="mt-8">
            <h3 className="text-base font-extrabold text-zinc-800">٤. لماذا دلال وليس حلاً عالمياً؟</h3>
            <div className="mt-4 grid gap-4 text-sm leading-6 text-zinc-700 sm:grid-cols-2">
              <div className="rounded-[18px] border border-zinc-200 p-4">
                <p className="font-extrabold text-zinc-800">الحلول العالمية (Fresha وغيرها)</p>
                <p className="mt-1.5 text-zinc-500">
                  تحتسب لكل موظفة شهرياً — صالونك يدفع لديهم 2,000-5,000+ ريال، بواجهة غير عربية
                  وبدون فهم لطبيعة السوق المحلية.
                </p>
              </div>
              <div className="rounded-[18px] border border-pink-100 bg-pink-50/50 p-4">
                <p className="font-extrabold text-brand">دلال</p>
                <p className="mt-1.5 text-zinc-500">
                  999 ريال بلا حد موظفات، عربية بالكامل، بميزات مصممة لسوقك (عرابون، واتساب،
                  سناب شات)، ومالك لا يمر عبرنا — يصل حسابك مباشرة.
                </p>
              </div>
            </div>
          </section>

          {/* التجربة والضمان */}
          <section className="mt-8">
            <h3 className="text-base font-extrabold text-zinc-800">٥. التجربة والتثبيت</h3>
            <p className="mt-2.5 text-sm leading-6 text-zinc-600">
              تجربة مجانية 14 يوماً بكل الميزات — وترحيل بياناتك الحالية (سجل العمليات وسجل
              العمليات) يبدأ من اليوم الأول. لن توقّع عقداً قبل أن تلمس الفرق بنفسك في
              إشغال الدوام وحجم العرابون المحصَّل.
            </p>
          </section>

          {/* تواصل */}
          <footer className="mt-10 border-t-2 border-pink-100 pt-5 print:mt-6">
            <p className="text-center text-sm leading-6 text-zinc-600">
              جاهزون لعرض مباشر لصالونك — تواصل معنا وسنجدول التجربة في نفس الأسبوع.
            </p>
            <p dir="ltr" className="mt-2 text-center font-mono text-xs text-gray-400">
              dalal.sa — dalal.sa/pricing — dalal.sa/b/demo-salon
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}

function Problem({ n, d }: { n: string; d: string }) {
  return (
    <div className="rounded-[18px] border border-zinc-200 p-4">
      <p className="font-extrabold text-zinc-800">{n}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{d}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td className="p-2 text-zinc-700">{k}</td>
      <td className="p-2 text-left font-bold">{v}</td>
    </tr>
  );
}
