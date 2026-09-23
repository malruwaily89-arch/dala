import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6">
        <header className="flex items-center justify-between py-6">
          <span className="text-2xl font-extrabold text-brand">سيدة</span>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-white"
            >
              الأسعار
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-white"
            >
              دخول الصالونات
            </Link>
          </div>
        </header>

        <section className="py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-snug md:text-5xl md:leading-snug">
            حجوزات صالونك منظمة،
            <br />
            والعربون محصّل قبل ما تختفي العميلة.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600">
            صفحة حجز خاصة بصالونك على واتساب، عربون إلكتروني يمنع الغائبات،
            وقائمة انتظار تملأ كل موعد ملغى. كل هذا بلغة تفهمها عميلاتك.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-brand px-8 py-3.5 font-bold text-white shadow-lg shadow-pink-900/20 transition hover:opacity-90"
            >
              ابدئي الآن — تجربة مجانية
            </Link>
            <Link
              href="/b/demo-salon"
              className="rounded-full border border-zinc-300 px-8 py-3.5 font-bold hover:bg-white"
            >
              جرّبي صفحة حجز تجريبية
            </Link>
          </div>
        </section>

        <section className="grid gap-6 pb-24 md:grid-cols-3">
          {[
            {
              title: "عربون يحمي وقتك",
              body: "الحجز لا يُثبت إلا بعد دفع العربون. الستريبر لا يكلفك سوى خمسة دقائق من متابعة التحويل.",
              icon: "💳",
            },
            {
              title: "واتساب يتكلم عنك",
              body: "تأكيد، تذكير قبل الموعد، ومتابعة بعد الزيارة — تلقائياً من رقمك المعروف لدى عميلاتك.",
              icon: "💬",
            },
            {
              title: "قائمة انتظار ذكية",
              body: "كل موعد ملغى يُعرض فوراً على قائمة الانتظار، فلا يضيع أي ربع ساعة من يومك.",
              icon: "⏳",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{f.body}</p>
            </div>
          ))}
        </section>
      </div>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        سيدة © {new Date().getFullYear()} — صُنعت لصالونات السعودية
      </footer>
    </main>
  );
}
