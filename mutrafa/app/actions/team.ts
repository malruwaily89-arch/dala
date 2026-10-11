"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCan } from "@/lib/guard";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assignableRoles } from "@/lib/permissions";
import { hasFeature } from "@/lib/plans";
import { teamInviteSchema, firstIssue } from "@/lib/validation";
import { BookingError } from "@/lib/booking";

const PATH = "/dashboard/team";

export async function inviteUserAction(formData: FormData) {
  let done = false;
  try {
    const { user, salon, ctx } = await requireCan("team.manage");
    if (ctx.remaining.admins <= 0) {
      throw new BookingError(`بلغتِ الحد الأقصى لحسابات الإدارة في باقتك (${ctx.entitlements.admins}).`);
    }
    const parsed = teamInviteSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: String(formData.get("role") ?? "OWNER"),
    });
    if (!parsed.success) throw new BookingError(firstIssue(parsed.error));

    // الأدوار المتعددة تتطلب الذهبية؛ في الباقات الأدنى يكون كل حساب "مالكة"
    const allowed = assignableRoles(hasFeature(ctx.entitlements, "roles"));
    const role = allowed.includes(parsed.data.role) ? parsed.data.role : "OWNER";

    const exists = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
    if (exists) throw new BookingError("هذا البريد مسجّل مسبقاً");

    const created = await db.user.create({
      data: {
        salonId: salon.id,
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash: await hashPassword(parsed.data.password),
        role,
      },
    });
    await audit({ salonId: salon.id, userId: user.id, action: "user.invited", entityType: "user", entityId: created.id, meta: { role } });
    done = true;
  } catch (e) {
    redirect(`${PATH}?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }
  if (done) {
    revalidatePath(PATH);
    redirect(`${PATH}?ok=invited`);
  }
}

export async function toggleUserAction(formData: FormData) {
  let done = false;
  try {
    const { user, salon, ctx } = await requireCan("team.manage");
    const target = await db.user.findFirst({ where: { id: String(formData.get("id")), salonId: salon.id } });
    if (!target) throw new BookingError("المستخدم غير موجود");
    if (target.id === user.id) throw new BookingError("لا يمكنك تعطيل حسابك");
    if (!target.active && ctx.remaining.admins <= 0) {
      throw new BookingError("بلغتِ الحد الأقصى لحسابات الإدارة في باقتك.");
    }
    await db.user.update({ where: { id: target.id }, data: { active: !target.active } });
    if (target.active) await db.session.deleteMany({ where: { userId: target.id } });
    await audit({ salonId: salon.id, userId: user.id, action: "user.toggled", entityType: "user", entityId: target.id });
    done = true;
  } catch (e) {
    redirect(`${PATH}?error=${encodeURIComponent(e instanceof Error ? e.message : "خطأ")}`);
  }
  if (done) revalidatePath(PATH);
}
