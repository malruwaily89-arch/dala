import Link from "next/link";
import Image from "next/image";
import { PricingTabs } from "./pricing-tabs";
import { type Package } from "./package-card";

const REGULAR_PACKAGES: Package[] = [
  {
    name: "الأساسية",
    price: 199,
    yearly: 1990,
    tagline: "للصالون المنزلي",
    popular: false,
    features: [
      "حتى موظفتان",
      "صفحة حجز عامة باسم صالونك",
      "دورة عربون كاملة (تمنع الغائبات)",
      "منع تعارض المواعيد تلقائياً",
      "تأكيدات واتساب",
      "سجل عميلات وعداد غيابات",
    ],
  },
  {
    name: "النمو",
    price: 449,
    yearly: 4490,
    tagline: "للصالون المتوسط",
    popular: true,
    features: [
      "موظفات بلا حد",
      "كل ميزات الأساسية",
      "تذكير آلي قبل الموعد بـ 24 ساعة",
      "قائمة انتظار ذكية (كل إلغاء يتحرر فوراً)",
      "تقارير أسبوعية (إيراد، حضور، وفاء)",
      "عربون مختلف لكل خدمة",
    ],
  },
  {
    name: "الاحترافية",
    price: 999,
    yearly: 9990,
    tagline: "للصالون الكبير والواقع ذو الحركة الكثيفة",
    popular: false,
    features: [
      "كل ميزات النمو",
      "تقارير متقدمة ونسب إشغال",
      "صلاحيات متعددة (مشرفات، موظفات)",
      "بوابة دفع إلكتروني كاملة",
      "أولوية دعم",
      "إعداد ومساعدة ترحيل",
    ],
  },
];

const PRO_PACKAGES: Package[] = [
  {
    name: "الأساسية برو",
    price: 299,
    yearly: 2990,
    tagline: "كل ميزات الأساسية + تقارير وتقييمات متقدمة",
    pro: true,
    features: [
      "كل ميزات الأساسية العادية",
      "تقرير شهري مفصّل (إيراد، حضور، غياب)",
      "تقييم العميلات بعد كل خدمة (5 نجوم)",
      "إحصائية أكثر الخدمات طلباً",
      "تنبيه تلقائي عند ارتفاع نسبة الإلغاء",
    ],
  },
  {
    name: "النمو برو",
    price: 599,
    yearly: 5990,
    tagline: "كل ميزات النمو + تقارير وتقييمات متقدمة",
    popular: true,
    pro: true,
    features: [
      "كل ميزات الأساسية برو",
      "مقارنة أداء شهر بشهر (نسب التغيّر %)",
      "تحليل ذروة الأيام والساعات (أكثر الأوقات ازدحاماً)",
      "تقييم أداء كل موظفة على حدة + بانر \"أعلى تقييماً\"",
      "معدل تحصيل العربون ونسبة عدم الحضور",
      "تقرير أسبوعي تلقائي على واتساب",
    ],
  },
  {
    name: "الاحترافية برو",
    price: 1299,
    yearly: 12990,
    tagline: "كل ميزات الاحترافية + تقارير وتقييمات متقدمة",
    pro: true,
    features: [
      "كل ميزات النمو برو",
      "لوحة تحكم لحظية (إيرادات اليوم، حجوزات الساعة)",
      "تقارير مقارنة بين الفروع (متعدد الفروع)",
      "تحليل ربحية كل خدمة (تكلفة vs إيراد)",
      "بانر \"يحتاج تحسين\" للموظفات + خطط تطوير مقترحة",
      "مدير حساب مخصص + أولوية دعم واتساب",
      "تصدير التقارير PDF/Excel",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="flex-1 bg-[#faf5eb]">
      <div className="bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#4a2075]">
        <div className="mx-auto max-w-6xl px-6 pb-12">
          <header className="flex items-center justify-between py-6">
            <Link href="/" aria-label="دلال">
              <Image src="/dalal-logo.png" alt="دلال" width={150} height={100} className="h-auto w-36" priority />
            </Link>
            <Link
              href="/pricing/proposal"
              className="rounded-full border border-[#c9a84c]/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              عرض المشاريع الكبيرة
            </Link>
          </header>

          <section className="py-10 text-center md:py-14">
            <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-snug text-white md:text-5xl md:leading-snug">
              أسعار واضحة،
              <br />
              تُدرّ عليك أكثر من ثمنها كل شهر.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
              جرّبي مجاناً 14 يوماً — وبدون بطاقة. الحجز المفقود الواحد غالباً أغلى من الشهر كله.
            </p>
          </section>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <PricingTabs regular={REGULAR_PACKAGES} pro={PRO_PACKAGES} />

        <section className="rounded-[36px] border border-[#c9a84c]/25 bg-white/90 p-8 text-center md:p-10">
          <h2 className="text-xl font-extrabold text-zinc-800">أسئلة تُسأل كثيراً</h2>
          <div className="mx-auto mt-6 grid max-w-3xl gap-6 text-start md:grid-cols-2">
            <Faq q="هل أعمالي تمر عبر حسابكم؟" a="لا — العرابون يُحوَّل مباشرة إلى حسابك المصرفي الذي تحددينه. المال لا يمر عبرنا إطلاقاً." />
            <Faq q="هل يحتاج العميلات تثبيت تطبيق؟" a="لا — يكفيهن رابط صفحة حجرك في بايو سناب شات أو إنستغرام أو واتساب." />
            <Faq q="ماذا لو نمى صالوني؟" a="ترقين الباقة نقرة واحدة، وشعرك وإعداداتك وحجوزك لا تتأثر." />
            <Faq q="ما الفرق بين الباقة العادية والباقة برو؟" a="باقات برو تضيف تقارير متقدمة (مقارنة شهرية، ذروة الأيام والساعات، معدلات التحصيل والإلغاء) وتحليل تقييمات مفصّل لكل موظفة وخدمة." />
            <Faq q="هل بيانات عميلاتي محمية؟" a="نعم — بيانات كل صالون معزولة تماماً عن غيره، ونمتثل نظام حماية البيانات الشخصية." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="font-bold text-zinc-800">{q}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{a}</p>
    </div>
  );
}
