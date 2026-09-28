"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, hashPassword } from "@/lib/auth";
import { isManagementRole } from "@/lib/permissions";

/**
 * غير المسميات الإدارية (موظفة استقبال/مشرفة/إدارية) لا يُسمح لهن بأي صلاحية غير الاطلاع على
 * جدولهن الخاص — نتجاهل أي شي مُرسَل من الفورم لهذي الحالة ونفرض القيم المقيّدة دائماً، بغض
 * النظر عمّا وصل فعلياً (دفاع من العبث بالفورم، لا مجرد إخفاء بالواجهة).
 */
function readPermissions(formData: FormData, isManagement: boolean) {
  if (!isManagement) {
    return {
      canCancelAppointments: false,
      canAddAppointments: false,
      canViewAppointmentStatus: true,
      canManageStaffSchedules: false,
    };
  }
  return {
    canCancelAppointments: formData.get("canCancelAppointments") === "on",
    canAddAppointments: formData.get("canAddAppointments") === "on",
    canViewAppointmentStatus: formData.get("canViewAppointmentStatus") === "on",
    canManageStaffSchedules: formData.get("canManageStaffSchedules") === "on",
  };
}

/** تنشئ حساب دخول لموظفة (role=STAFF) — للمالكة فقط، لا يستدعيها حساب موظفة أبداً */
export async function createStaffLoginAction(formData: FormData) {
  const user = await requireUser();
  if (user.role === "STAFF") redirect("/dashboard/staff?error=forbidden");

  const staffId = String(formData.get("staffId") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!staffId || !email || !password) redirect("/dashboard/staff?error=missing");
  if (password.length < 6) redirect("/dashboard/staff?error=password");

  const staff = await db.staff.findFirst({ where: { id: staffId, tenantId: user.tenantId } });
  if (!staff) redirect("/dashboard/staff?error=1");

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) redirect("/dashboard/staff?error=exists");

  await db.user.create({
    data: {
      tenantId: user.tenantId,
      email,
      passwordHash: hashPassword(password),
      name: staff.name,
      role: "STAFF",
      staffId: staff.id,
      emailVerifiedAt: new Date(), // أنشأتها المالكة مباشرة — لا تحتاج تفعيل بريد
      ...readPermissions(formData, isManagementRole(staff.jobTitle)),
    },
  });

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?ok=1");
}

/** تعديل صلاحيات حساب موظفة موجود — للمالكة فقط */
export async function updateStaffPermissionsAction(formData: FormData) {
  const user = await requireUser();
  if (user.role === "STAFF") redirect("/dashboard/staff?error=forbidden");

  const userId = String(formData.get("userId") || "");
  const target = await db.user.findFirst({
    where: { id: userId, tenantId: user.tenantId, role: "STAFF" },
    include: { staff: true },
  });
  if (!target) redirect("/dashboard/staff?error=1");

  await db.user.update({ where: { id: userId }, data: readPermissions(formData, isManagementRole(target.staff?.jobTitle)) });

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?ok=1");
}

/** حذف حساب دخول موظفة (بدون حذف سجل الموظفة نفسه) — للمالكة فقط */
export async function deleteStaffLoginAction(formData: FormData) {
  const user = await requireUser();
  if (user.role === "STAFF") redirect("/dashboard/staff?error=forbidden");

  const userId = String(formData.get("userId") || "");
  const target = await db.user.findFirst({ where: { id: userId, tenantId: user.tenantId, role: "STAFF" } });
  if (!target) redirect("/dashboard/staff?error=1");

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/dashboard/staff");
  redirect("/dashboard/staff?ok=1");
}
