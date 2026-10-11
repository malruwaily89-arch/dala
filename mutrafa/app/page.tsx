import Link from "next/link";
import { MarketingShell } from "@/components/marketing/shell";
import { btnPrimary, Card } from "@/components/ui";
import { PLANS, PLAN_CODES, ADDONS, ADDON_KINDS, TRIAL_DAYS } from "@/lib/plans";

const STEPS = [
  { t: "تراسل صالونك على واتساب", d: "العميلة ترسل رسالة إلى رقم صالونك." },
  { t: "ترد عليها خدمة آلية", d: "اختاري 1 للحجز أو 2 للاستفسار، ويصلها رابط صالونك." },
  { t: "تدخل بياناتها", d: "الاسم والجوال، ثم تختار الخدمة واليوم والوقت." },
  { t: "تدفع العربون", d: "عبر مدى أو فيزا أو Apple Pay أو Google Pay." },
  { t: "يُؤكَّد موعدها", d: "تصلها رسالة التأكيد من رقم صالونك مباشرة." },
];

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-block rounded-full bg-gold-soft px-4 py-1 text-xs font-bold text-gold">
              عربون إلكتروني يمنع الغياب
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight text-brand md:text-5xl">
              عميلتك تحجز وتدفع العربون من واتساب
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-700">
              صفحة حجز باسم صالونك، وعربون يُدفع فوراً، وتذكيرات تصل من رقم صالونك. بدون عمولة على العربون.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/signup" className={btnPrimary}>ابدئي تجربة {TRIAL_DAYS} يوماً مجاناً</Link>
              <span className="text-sm text-zinc-600">بدون بطاقة بنكية</span>
            </div>
          </div>
          <Card className="p-0">
            <div className="rounded-2xl bg-brand p-6 text-white">
              <p className="text-sm opacity-80">لوحة صالونك — اليوم</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold">10</p><p className="text-xs opacity-80">مواعيد</p></div>
                <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold">8</p><p className="text-xs opacity-80">عربون مدفوع</p></div>
                <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold">2</p><p className="text-xs opacity-80">بانتظار الدفع</p></div>
              </div>
            </div>
            <div className="space-y-2 p-5 text-sm">
              {["10:00 — جلسة شعر · سارة", "11:30 — مانيكير · نورة", "13:00 — عناية بالبشرة · ريم"].map((row) => (
                <div key={row} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <span className="font-semibold">{row}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">مؤكد</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section id="how" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold text-brand">كيف تعمل مُترَفة؟</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.t} className="rounded-2xl border border-brand/10 bg-ivory p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                <p className="mt-3 font-bold text-ink">{s.t}</p>
                <p className="mt-1 text-sm text-zinc-600">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="plans" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold text-brand">باقة تناسب حجم صالونك</h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            أسعار التأسيس الشهرية، وتشمل التجربة المجانية الكاملة بميزات الذهبية لمدة {TRIAL_DAYS} يوماً.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_CODES.map((code) => {
              const p = PLANS[code];
              const featured = code === "GOLD";
              return (
                <div
                  key={code}
                  className={`flex flex-col rounded-2xl border p-6 ${featured ? "border-gold bg-white shadow-lg ring-2 ring-gold/30" : "border-brand/10 bg-white shadow-sm"}`}
                >
                  {featured && <span className="mb-3 w-fit rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-white">الأكثر طلباً</span>}
                  <h3 className="font-serif text-2xl font-bold text-brand">{p.nameAr}</h3>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-ink">{p.priceSar}</span>
                    <span className="text-sm text-zinc-600">ر.س / شهر</span>
                  </p>
                  <p className="text-xs text-zinc-500 line-through">{p.regularPriceSar} ر.س عادي</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-zinc-700">
                    {p.highlightsAr.map((h) => (
                      <li key={h} className="flex gap-2"><span className="text-gold">✓</span>{h}</li>
                    ))}
                  </ul>
                  <Link href={`/signup?plan=${code}`} className={`${btnPrimary} mt-6`}>اختاري {p.nameAr}</Link>
                </div>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl border border-brand/10 bg-white p-6">
            <h3 className="font-bold text-brand">إضافات شهرية</h3>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-3">
              {ADDON_KINDS.map((k) => (
                <li key={k} className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <span>{ADDONS[k].nameAr}</span>
                  <span className="font-bold">{ADDONS[k].priceSar} ر.س</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
