import type { Metadata } from "next";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { bookingUrl } from "@/lib/env";
import { db } from "@/lib/db";
import { formatLocalDate, localDayKey } from "@/lib/time";
import { updateSettingsAction } from "@/app/actions/settings";
import { addClosedDayAction, removeClosedDayAction, removeLogoAction, uploadLogoAction } from "@/app/actions/salon-extras";
import { Banner, Card, EmptyState, Field, PageHeader, btnPrimary, btnGhost, inputCls } from "@/components/ui";

export const metadata: Metadata = { title: "إعدادات الصالون" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { ok, error } = await searchParams;
  if (!canUse(user, ctx, "settings.manage")) return <EmptyState>إعدادات الصالون للمالكة والمشرفة فقط.</EmptyState>;

  const [logo, closedDays] = await Promise.all([
    db.salonLogo.findUnique({ where: { salonId: salon.id }, select: { mime: true } }),
    db.closedDay.findMany({ where: { salonId: salon.id }, orderBy: { dayKey: "asc" } }),
  ]);
  const todayKey = localDayKey(new Date(), salon.timezone);
  const upcomingClosed = closedDays.filter((d) => d.dayKey >= todayKey);

  return (
    <div>
      <PageHeader title="إعدادات الصالون" subtitle="هوية الصالون وسياسة العربون والإلغاء وربط واتساب." />
      {ok === "saved" && <Banner tone="success">تم حفظ الإعدادات.</Banner>}
      {ok === "logo" && <Banner tone="success">تم تحديث شعار الصالون.</Banner>}
      {ok === "closed" && <Banner tone="success">تم تحديث أيام الإغلاق.</Banner>}
      {error && <Banner>{error}</Banner>}

      <Card className="mb-6">
        <p className="text-sm text-zinc-600">رابط الحجز الخاص بصالونك</p>
        <p dir="ltr" className="mt-1 break-all font-bold text-brand">{bookingUrl(salon.slug)}</p>
        {ctx.bookingsOpen ? null : <p className="mt-2 text-xs text-rose-700">صفحة الحجز متوقفة حالياً — راجعي الباقة.</p>}
      </Card>

      <form action={updateSettingsAction} className="grid gap-5 md:grid-cols-2">
        <Card className="space-y-4 md:col-span-2">
          <h2 className="font-bold text-ink">الهوية</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="اسم الصالون" name="name" required defaultValue={salon.name} />
            <Field label="المدينة" name="city" defaultValue={salon.city ?? ""} />
            <Field label="لون العلامة" name="brandColor" type="color" defaultValue={salon.brandColor} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-ink">العربون والإلغاء</h2>
          <Field label="مهلة الإلغاء المجاني (ساعات)" name="cancellationHours" type="number" defaultValue={salon.cancellationHours} hint="بعدها يُحتفظ بالعربون. الخدمة قد تملك مهلتها الخاصة (الذهبية)." />
          <Field label="نص سياسة العربون" name="depositPolicy" defaultValue={salon.depositPolicy ?? ""}>
            <textarea name="depositPolicy" rows={3} defaultValue={salon.depositPolicy ?? ""} className={inputCls} />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-ink">حساب التحويل البنكي</h2>
          <Field label="اسم البنك" name="bankName" defaultValue={salon.bankName ?? ""} />
          <Field label="الآيبان" name="bankIban" dir="ltr" defaultValue={salon.bankIban ?? ""} />
        </Card>

        <Card className="space-y-4 md:col-span-2">
          <h2 className="font-bold text-ink">ربط واتساب</h2>
          <p className="text-sm text-zinc-600">
            الرسائل تُرسل من رقم الصالون نفسه بعد ربطه بمنصة Meta. أدخلي معرّف رقم الهاتف (Phone number ID) لتفعيل الإرسال الفعلي.
            بدونه تُسجَّل الرسائل كمحاكاة. الرقم المعروض: <span dir="ltr" className="font-semibold">{salon.whatsappNumber}</span>
          </p>
          <Field label="معرّف رقم واتساب (Phone number ID)" name="whatsappPhoneNumberId" dir="ltr" defaultValue={salon.whatsappPhoneNumberId ?? ""} />
        </Card>

        <div className="md:col-span-2">
          <button className={btnPrimary}>حفظ الإعدادات</button>
        </div>
      </form>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-bold text-ink">شعار الصالون</h2>
          <p className="text-sm text-zinc-600">
            يظهر الشعار في صفحة الحجز، ويُرسل مع رسائل واتساب ليتعرّف عليه العميلات. صيغ مقبولة: PNG أو JPG أو WEBP، وحجمها حتى 512 كيلوبايت، ويُفضّل أن تكون مربعة.
          </p>
          {logo ? (
            <div className="flex items-center gap-4 rounded-xl border border-gold/30 bg-gold-soft p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/salon-logo/${salon.slug}`} alt="شعار الصالون" className="h-20 w-20 rounded-xl bg-white object-contain p-1" />
              <form action={removeLogoAction}>
                <button className="text-sm font-bold text-rose-700 underline-offset-4 hover:underline">إزالة الشعار</button>
              </form>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-brand/25 p-4 text-sm text-zinc-500">لم يُرفع شعار بعد.</p>
          )}
          <form action={uploadLogoAction} encType="multipart/form-data" className="flex flex-wrap items-center gap-3">
            <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" required className="text-sm" />
            <button className={btnGhost}>رفع الشعار</button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-ink">أيام الإغلاق</h2>
          <p className="text-sm text-zinc-600">في هذه الأيام لا تُقبل حجوزات جديدة، ولا تظهر فيها فتحات في صفحة الحجز.</p>
          <form action={addClosedDayAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="التاريخ" name="dayKey" type="date" required defaultValue={todayKey} />
            <Field label="السبب" name="reason" placeholder="مثال: عيد الفطر" />
            <button className={btnPrimary}>إضافة</button>
          </form>
          {upcomingClosed.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد أيام إغلاق قادمة.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
              {upcomingClosed.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span>
                    <span className="font-bold text-rose-700">{formatLocalDate(new Date(`${d.dayKey}T12:00:00Z`), "UTC")}</span>
                    {d.reason && <span className="ms-2 text-zinc-600">· {d.reason}</span>}
                  </span>
                  <form action={removeClosedDayAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="text-xs font-bold text-zinc-600 underline-offset-4 hover:underline">حذف</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
