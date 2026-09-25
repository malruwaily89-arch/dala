import Link from "next/link";
import Image from "next/image";
import { formatSar } from "@/lib/utils";

const FEATURES = [
  {
    title: "عربون يحمي وقتك",
    body: "الحجز لا يُثبت إلا بعد دفع العربون. لا مزيد من المواعيد الضائعة على عميلة لم تحضر.",
    icon: "💳",
  },
  {
    title: "واتساب يتكلم عنك",
    body: "تأكيد، تذكير قبل الموعد، ومتابعة بعد الزيارة — تلقائياً من رقمك المعروف لدى عميلاتك.",
    icon: "💬",
  },
  {
    title: "لا تعارض في المواعيد",
    body: "كل موظفة بجدولها المستقل — النظام يمنع الحجز المزدوج على نفس الوقت تلقائياً.",
    icon: "🗓️",
  },
  {
    title: "هوية خاصة بعلامتك",
    body: "شعارك، ألوانك، واسمك على صفحة حجز مستقلة — تشعر عميلاتك أنها تجربة علامتك فقط.",
    icon: "🎨",
  },
];

const PACKAGES = [
  { name: "الأساسية", price: 199, tagline: "للمشروع المنزلي" },
  { name: "النمو", price: 449, tagline: "للمركز المتوسط", popular: true },
  { name: "الاحترافية", price: 999, tagline: "للمركز الكبير" },
];

export default function Home() {
  return (
    <main className="flex-1 overflow-hidden bg-[#faf5eb]">
      {/* خلفية ناعمة متدرجة */}
      <div className="relative bg-gradient-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#4a2075] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-[#c9a84c]/25 blur-3xl" />
          <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-[#5c2d91]/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">
          <header className="flex items-center justify-between py-6">
            <Image src="/dalal-logo.png" alt="دلال" width={150} height={100} className="h-auto w-36" priority />
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="rounded-full border border-[#c9a84c]/50 bg-white/10 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:border-[#c9a84c] hover:bg-white/15"
              >
                الأسعار
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-[#c9a84c]/50 bg-white/10 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:border-[#c9a84c] hover:bg-white/15"
              >
                دخول المراكز
              </Link>
            </div>
          </header>

          <section className="py-16 text-center md:py-24">
            <span className="mx-auto mb-5 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-[#d4af5c] shadow-sm ring-1 ring-[#c9a84c]/40">
              صالونات التجميل • مراكز العناية بالبشرة • عيادات الليزر
            </span>
            <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-snug md:text-5xl md:leading-snug">
              حجوزات مركزك منظمة،
              <br />
              والعربون محصّل قبل ما تختفي العميلة.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/80">
              صفحة حجز خاصة بعلامتك على واتساب وسناب شات، عربون إلكتروني يمنع
              الغائبات، وقائمة انتظار تملأ كل موعد ملغى — كل هذا بلغة تفهمها عميلاتك.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-full bg-[#c9a84c] px-8 py-3.5 font-bold text-[#2d1b4e] shadow-lg shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:bg-[#d4af5c]"
              >
                ابدئي الآن — تجربة مجانية
              </Link>
              <Link
                href="/b/demo-salon"
                className="rounded-full border border-white/30 bg-white/10 px-8 py-3.5 font-bold transition-all duration-300 hover:border-[#c9a84c] hover:shadow-sm"
              >
                جرّبي صفحة حجز تجريبية
              </Link>
            </div>
          </section>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6">
        {/* المزايا */}
        <section className="grid gap-6 py-16 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[28px] border border-[#c9a84c]/15 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#c9a84c]/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5eddb] text-2xl">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-zinc-800">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{f.body}</p>
            </div>
          ))}
        </section>

        {/* الباقات */}
        <section className="py-8">
          <div className="text-center">
              <h2 className="text-2xl font-extrabold text-[#2d1b4e] md:text-3xl">
              باقة تناسب حجم مركزك
            </h2>
            <p className="mt-3 text-zinc-500">جرّبي مجاناً 14 يوماً — بدون بطاقة.</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {PACKAGES.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-[28px] border-2 bg-white p-7 text-center transition-all duration-300 hover:-translate-y-1 ${
                  p.popular
                    ? "border-brand shadow-lg shadow-[#c9a84c]/25"
                    : "border-[#c9a84c]/15 shadow-sm"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3.5 right-1/2 translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-bold text-white shadow">
                    الأكثر طلباً
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-zinc-800">{p.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{p.tagline}</p>
                <p className="mt-4">
                  <span className="text-3xl font-extrabold text-brand">{formatSar(p.price)}</span>
                  <span className="text-zinc-400"> / شهرياً</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="text-sm font-bold text-brand underline-offset-4 hover:underline"
            >
              تفاصيل كل باقة ←
            </Link>
          </div>
        </section>
      </div>

      <footer className="border-t border-[#c9a84c]/25 bg-[#1a0a2e] py-8 text-center text-sm text-white/70">
        دلال © {new Date().getFullYear()} — صُنعت لمراكز التجميل والعناية في السعودية
      </footer>
    </main>
  );
}
