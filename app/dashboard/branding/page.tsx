import { requireUser } from "@/lib/auth";
import { updateBrandingAction } from "@/app/actions/branding";
import { Banner } from "../ui";

export default async function BrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const user = await requireUser();
  const { ok } = await searchParams;
  const t = user.tenant;

  const initials = t.name.replace(/^(صالون|مركز)\s*/, "").charAt(0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">مظهر صالونك</h1>
      <p className="mt-1 text-sm text-zinc-500">
        هذه الهوية التي تظهر لعميلاتك في صفحة الحجم — شعارك، لونك المميز، ورقمك.
      </p>

      {ok && <Banner success>تم حفظ مظهر صالونك.</Banner>}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* معاينة حية */}
        <div className="lg:w-80 lg:shrink-0">
          <p className="mb-2 text-sm font-bold text-zinc-700">معاينة ما تراه العميلة:</p>
          <div
            dir="rtl"
            className="overflow-hidden rounded-[32px] border border-pink-100 bg-gradient-to-b from-rose-50 via-pink-50 to-white p-8 text-center shadow-md"
            style={{ ["--brand"]: t.brandColor } as React.CSSProperties}
          >
            <div className="mx-auto w-fit rounded-[24px] border-2 border-white bg-white p-1.5 shadow-lg">
              {t.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.logoUrl} alt={t.name} className="h-16 w-16 rounded-[18px] object-cover" />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-[18px] text-2xl font-extrabold text-white"
                  style={{ backgroundColor: t.brandColor }}
                >
                  {initials}
                </div>
              )}
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-brand">{t.name}</h2>
            <p className="mt-1 text-xs text-zinc-500">احجزي موعدك في دقيقة 🌸</p>
            <button
              className="mt-5 w-full rounded-full py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: "var(--brand)" }}
            >
              تأكيد الحجز
            </button>
          </div>
          <p dir="ltr" className="mt-3 text-center font-mono text-xs text-zinc-400">
            /b/{t.slug}
          </p>
        </div>

        {/* النموذج */}
        <form action={updateBrandingAction} className="flex-1 space-y-6">
          <div className="rounded-[28px] border border-pink-100 bg-white p-6">
            <h3 className="font-extrabold text-zinc-800">العلامة التجارية</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-zinc-700">
                  رابط الشعار (Logo)
                </span>
                <input
                  name="logoUrl"
                  type="url"
                  dir="ltr"
                  defaultValue={t.logoUrl ?? ""}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-[18px] border-2 border-pink-100 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
                <span className="mt-1 block text-xs text-zinc-400">
                  ارفعي شعارك على أي خدمة صور وضعي الرابط هنا — مربع أو دائرة أفضل.
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-zinc-700">اللون المميز</span>
                <span className="flex items-center gap-3">
                  <input
                    name="brandColor"
                    type="color"
                    defaultValue={t.brandColor}
                    className="h-11 w-16 cursor-pointer rounded-xl border-2 border-pink-100 bg-white p-1"
                  />
                  <span dir="ltr" className="font-mono text-xs text-zinc-400">
                    {t.brandColor}
                  </span>
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-zinc-700">رقم واتساب الصالون</span>
                <input
                  name="whatsappNumber"
                  type="tel"
                  dir="ltr"
                  defaultValue={t.whatsappNumber ?? ""}
                  placeholder="05xxxxxxxx"
                  className="w-full rounded-[18px] border-2 border-pink-100 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[28px] border border-pink-100 bg-white p-6">
            <h3 className="font-extrabold text-zinc-800">حساب تحويل العربون</h3>
            <p className="mt-1 text-xs text-zinc-400">يظهر لعميلاتك في صفحة الدفع.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-zinc-700">اسم المصرف</span>
                <input
                  name="bankName"
                  defaultValue={t.bankName ?? ""}
                  placeholder="مصرف الراجحي"
                  className="w-full rounded-[18px] border-2 border-pink-100 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-zinc-700">رقم الآيبان (IBAN)</span>
                <input
                  name="bankIban"
                  dir="ltr"
                  defaultValue={t.bankIban ?? ""}
                  placeholder="SAxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-[18px] border-2 border-pink-100 px-4 py-3 text-sm focus:border-brand focus:outline-none"
                />
              </label>
            </div>
          </div>

          <button
            className="rounded-full bg-brand px-8 py-3 font-bold text-white transition hover:opacity-90"
          >
            حفظ المظهر
          </button>
        </form>
      </div>
    </div>
  );
}
