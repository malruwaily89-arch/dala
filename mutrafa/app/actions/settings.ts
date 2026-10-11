"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCan } from "@/lib/guard";
import { audit } from "@/lib/audit";
import { BookingError } from "@/lib/booking";
import { startPlanPurchase, startAddonPurchase } from "@/lib/payments";
import { isPlanCode, ADDON_KINDS, type AddonKindCode } from "@/lib/plans";

function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : "خطأ")}`);
}

export async function updateSettingsAction(formData: FormData) {
  const path = "/dashboard/settings";
  let done = false;
  try {
    const { user, salon } = await requireCan("settings.manage");
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) throw new BookingError("اسم الصالون قصير جداً");
    const cancellationHours = Math.min(168, Math.max(0, Number(formData.get("cancellationHours") ?? 24)));
    const brandColor = String(formData.get("brandColor") ?? "#8a1538");
    if (!/^#[0-9a-fA-F]{6}$/.test(brandColor)) throw new BookingError("لون العلامة غير صالح");
    const phoneNumberId = String(formData.get("whatsappPhoneNumberId") ?? "").trim() || null;
    if (phoneNumberId && !/^\d{6,20}$/.test(phoneNumberId)) throw new BookingError("معرّف رقم واتساب غير صالح");

    await db.salon.update({
      where: { id: salon.id },
      data: {
        name,
        city: String(formData.get("city") ?? "").trim() || null,
        depositPolicy: String(formData.get("depositPolicy") ?? "").trim() || null,
        bankName: String(formData.get("bankName") ?? "").trim() || null,
        bankIban: String(formData.get("bankIban") ?? "").trim() || null,
        cancellationHours,
        brandColor,
        whatsappPhoneNumberId: phoneNumberId,
      },
    });
    await audit({ salonId: salon.id, userId: user.id, action: "salon.settings_updated", entityType: "salon", entityId: salon.id });
    done = true;
  } catch (e) {
    fail(path, e);
  }
  if (done) {
    revalidatePath(path);
    redirect(`${path}?ok=saved`);
  }
}

export async function choosePlanAction(formData: FormData) {
  const path = "/dashboard/billing";
  let checkoutUrl: string | null = null;
  try {
    const { user, salon } = await requireCan("billing.manage");
    const plan = String(formData.get("plan") ?? "");
    if (!isPlanCode(plan)) throw new BookingError("باقة غير معروفة");
    const checkout = await startPlanPurchase({ salonId: salon.id, userId: user.id, plan });
    checkoutUrl = checkout.url;
  } catch (e) {
    fail(path, e);
  }
  if (checkoutUrl) redirect(checkoutUrl);
}

export async function buyAddonAction(formData: FormData) {
  const path = "/dashboard/billing";
  let checkoutUrl: string | null = null;
  try {
    const { user, salon } = await requireCan("billing.manage");
    const kind = String(formData.get("kind") ?? "");
    if (!(ADDON_KINDS as readonly string[]).includes(kind)) throw new BookingError("إضافة غير معروفة");
    const quantity = Math.min(10, Math.max(1, Number(formData.get("quantity") ?? 1)));
    const checkout = await startAddonPurchase({
      salonId: salon.id,
      userId: user.id,
      kind: kind as AddonKindCode,
      quantity,
    });
    checkoutUrl = checkout.url;
  } catch (e) {
    fail(path, e);
  }
  if (checkoutUrl) redirect(checkoutUrl);
}
