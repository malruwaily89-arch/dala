"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/whatsapp";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** تخصيص هوية الصالون: الشعار + اللون المميز + رقم واتساب + حساب تحويل العربون */
export async function updateBrandingAction(formData: FormData) {
  const user = await requireUser();
  const logoUrl = String(formData.get("logoUrl") || "").trim() || null;
  const brandColor = String(formData.get("brandColor") || "#be185d").trim();
  const whatsappNumber = String(formData.get("whatsappNumber") || "").trim() || null;
  const bankName = String(formData.get("bankName") || "").trim() || null;
  const bankIban = String(formData.get("bankIban") || "").trim() || null;

  await db.tenant.update({
    where: { id: user.tenantId },
    data: {
      logoUrl,
      brandColor: COLOR_RE.test(brandColor) ? brandColor : "#be185d",
      whatsappNumber: whatsappNumber ? normalizePhone(whatsappNumber) : null,
      bankName,
      bankIban,
    },
  });

  revalidatePath("/dashboard/branding");
  revalidatePath("/dashboard");
  revalidatePath(`/b/${user.tenant.slug}`);
  redirect("/dashboard/branding?ok=1");
}
