import type { Metadata } from "next";
import { requireDashboardUser, canUse } from "@/lib/guard";
import { bookingUrl } from "@/lib/env";
import { updateSettingsAction } from "@/app/actions/settings";
import { Banner, Card, EmptyState, Field, PageHeader, btnPrimary, inputCls } from "@/components/ui";

export const metadata: Metadata = { title: "إعدادات الصالون" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { user, salon, ctx } = await requireDashboardUser();
  const { ok, error } = await searchParams;
  if (!canUse(user, ctx, "settings.manage")) return <EmptyState>إعدادات الصالون للمالكة والمشرفة فقط.</EmptyState>;

  return (
    <div>
      <PageHeader title="إعدادات الصالون" subtitle="هوية الصالون وسياسة العربون والإلغاء وربط واتساب." />
      {ok === "saved" && <Banner tone="success">تم حفظ الإعدادات.</Banner>}
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
    </div>
  );
}
