import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { loadSalonContext } from "@/lib/salon-context";
import { hasFeature } from "@/lib/plans";
import { localDayKey, addDays, formatLocalDate } from "@/lib/time";
import { BookingWizard, type WizardDay } from "@/components/booking-wizard";
import { joinWaitlistAction } from "@/app/actions/public";
import { Banner, Card, Field, PhoneField, btnPrimary } from "@/components/ui";
import { isSlugAvailableFormat } from "@/lib/reserved";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; waitlist?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const salon = await db.salon.findUnique({ where: { slug }, select: { name: true } });
  return { title: salon ? `حجز في ${salon.name}` : "حجز موعد" };
}

/** صفحة الحجز العامة لكل صالون: mutrafa.d-alal.com/{slug} */
export default async function SalonBookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error, waitlist } = await searchParams;
  if (!isSlugAvailableFormat(slug)) notFound();

  const salon = await db.salon.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      calendars: { where: { isActive: true }, include: { services: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!salon) notFound();

  const ctx = await loadSalonContext(salon.id);
  const days: WizardDay[] = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { key: localDayKey(d, salon.timezone), label: formatLocalDate(d, salon.timezone) };
  }).filter((d, i, arr) => arr.findIndex((x) => x.key === d.key) === i);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 text-center">
        <p className="font-serif text-sm text-gold">{salon.city ?? "صالون"}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-brand">{salon.name}</h1>
        <p className="mt-2 text-sm text-zinc-600">احجزي موعدك بسهولة — ويُثبَّت الموعد بعد دفع العربون.</p>
      </header>

      {!ctx.bookingsOpen ? (
        <Card>
          <p className="text-center font-bold text-ink">الحجز متوقف مؤقتاً</p>
          <p className="mt-2 text-center text-sm text-zinc-600">يرجى التواصل مع الصالون عبر واتساب.</p>
        </Card>
      ) : salon.services.length === 0 || salon.calendars.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-zinc-600">لم تُضف الخدمات بعد. يرجى المحاولة لاحقاً.</p>
        </Card>
      ) : (
        <BookingWizard
          slug={salon.slug}
          error={error}
          depositPolicy={salon.depositPolicy}
          services={salon.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            priceHalalas: s.priceHalalas,
            depositHalalas: s.depositHalalas,
            calendarIds: salon.calendars.filter((c) => c.services.some((cs) => cs.serviceId === s.id)).map((c) => c.id),
          }))}
          calendars={salon.calendars.map((c) => ({ id: c.id, name: c.name }))}
          days={days}
        />
      )}

      {waitlist === "1" && <div className="mt-6"><Banner tone="success">تم تسجيلك في قائمة الانتظار 🌸 سنرسل لك رسالة عند تحرّر موعد.</Banner></div>}

      {ctx.bookingsOpen && hasFeature(ctx.entitlements, "waitlist.auto") && (
        <Card className="mt-8">
          <h2 className="font-bold text-ink">لا يوجد موعد يناسبك؟</h2>
          <p className="mb-4 mt-1 text-sm text-zinc-600">انضمي لقائمة الانتظار، وسنرسل لك رسالة فور تحرّر موعد.</p>
          <form action={joinWaitlistAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="slug" value={salon.slug} />
            <Field label="الاسم" name="name" required />
            <PhoneField name="phone" label="الجوال" />
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold">الخدمة</span>
              <select name="serviceId" required className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm">
                {salon.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <button className={`${btnPrimary} md:col-span-2`}>انضمي لقائمة الانتظار</button>
          </form>
        </Card>
      )}
    </div>
  );
}
