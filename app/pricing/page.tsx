import Link from "next/link";
import { formatSar } from "@/lib/utils";

const PACKAGES = [
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

export default function PricingPage() {
  return (
    <main className="flex-1 bg-gradient-to-b from-rose-50 via-pink-50 to-white">
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="text-2xl font-extrabold text-brand">
            سيدة
          </Link>
          <Link
            href="/pricing/proposal"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-white"
          >
            عرض المشاريع الكبيرة
          </Link>
        </header>

        <section className="py-10 text-center md:py-14">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-snug md:text-5xl md:leading-snug">
            أسعار واضحة،
            <br />
            تُدرّ عليك أكثر من ثمنها كل شهر.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600">
            جرّبي مجاناً 14 يوماً — وبدون بطاقة. الحجز المفقود الواحد غالباً أغلى من الشهر كله.
          </p>
        </section>

        <section className="grid gap-6 pb-10 md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-[36px] border-2 bg-white/90 p-8 backdrop-blur ${
                p.popular
                  ? "border-brand shadow-xl shadow-pink-200/60"
                  : "border-pink-100 shadow-md shadow-pink-100/50"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 right-8 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white shadow">
                  الأكثر طلباً 🌸
                </span>
              )}
              <h2 className="text-lg font-extrabold text-zinc-800">{p.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{p.tagline}</p>
              <p className="mt-5">
                <span className="text-4xl font-extrabold text-brand">{formatSar(p.price)}</span>
                <span className="text-zinc-400"> / شهرياً</span>
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                أو {formatSar(p.yearly)} سنوياً (شهران مجاناً)
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm leading-6 text-zinc-700">
                    <span className="text-brand">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-8 rounded-full py-3 text-center font-bold transition hover:opacity-90 ${
                  p.popular ? "bg-brand text-white shadow-lg" : "bg-pink-50 text-brand"
                }`}
              >
                ابدئي تجربتك المجانية
              </Link>
            </div>
          ))}
        </section>

        <section className="rounded-[36px] border border-pink-100 bg-white/90 p-8 text-center md:p-10">
          <h2 className="text-xl font-extrabold text-zinc-800">أسئلة تُسأل كثيراً</h2>
          <div className="mx-auto mt-6 grid max-w-3xl gap-6 text-start md:grid-cols-2">
            <Faq q="هل أعمالي تمر عبر حسابكم؟" a="لا — العرابون يُحوَّل مباشرة إلى حسابك المصرفي الذي تحددينه. المال لا يمر عبرنا إطلاقاً." />
            <Faq q="هل يحتاج العميلات تثبيت تطبيق؟" a="لا — يكفيهن رابط صفحة حجرك في بايو سناب شات أو إنستغرام أو واتساب." />
            <Faq q="ماذا لو نمى صالوني؟" a="ترقين الباقة نقرة واحدة، وشعرك وإعداداتك وحجوزك لا تتأثر." />
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
