import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { publicBookingAction } from "@/app/actions/appointments";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { BookingShell } from "./booking-shell";

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const [services, staff] = await Promise.all([
    db.service.findMany({ where: { tenantId: tenant.id, isActive: true } }),
    db.staff.findMany({ where: { tenantId: tenant.id, isActive: true } }),
  ]);

  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <LocaleProvider>
      <BookingShell
        slug={slug}
        tenant={{ id: tenant.id, name: tenant.name, logoUrl: tenant.logoUrl, brandColor: tenant.brandColor }}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          depositAmount: s.depositAmount,
        }))}
        staff={staff.map((st) => ({ id: st.id, name: st.name }))}
        days={days.map((d) => d.toISOString())}
        error={error}
        bookAction={publicBookingAction}
      />
    </LocaleProvider>
  );
}
