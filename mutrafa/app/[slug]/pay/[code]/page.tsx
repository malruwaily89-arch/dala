import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isBookingCode } from "@/lib/booking-code";
import { resumeDepositAction } from "@/app/actions/public";

/** يُنشئ جلسة دفع جديدة لعربون ما زال مستحقاً ثم يحوّل إليها */
export default async function PayDepositPage({ params }: { params: Promise<{ slug: string; code: string }> }) {
  const { slug, code } = await params;
  if (!isBookingCode(code)) notFound();
  const appt = await db.appointment.findUnique({ where: { code }, include: { salon: true } });
  if (!appt || appt.salon.slug !== slug) notFound();
  if (appt.status !== "PENDING_DEPOSIT") redirect(`/${slug}/booking/${code}`);

  let url: string;
  try {
    url = await resumeDepositAction(slug, code);
  } catch {
    redirect(`/${slug}/booking/${code}?error=${encodeURIComponent("تعذّر بدء الدفع، يرجى المحاولة لاحقاً")}`);
  }
  redirect(url);
}
