import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { loadSalonContext, type SalonContext } from "./salon-context";
import { permissionFeature, roleHas, type Permission } from "./permissions";
import { hasFeature } from "./plans";

export class ForbiddenError extends Error {
  constructor(message = "هذا الإجراء غير متاح في باقتك أو لدورك") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** يتحقق من الدور + الباقة معاً. يرمي ForbiddenError عند الرفض. */
export function assertCan(
  user: { role: Parameters<typeof roleHas>[0] },
  ctx: SalonContext,
  permission: Permission
): void {
  if (!roleHas(user.role, permission)) throw new ForbiddenError();
  const feature = permissionFeature(permission);
  if (feature && !hasFeature(ctx.entitlements, feature)) throw new ForbiddenError();
}

/** لصفحات لوحة التحكم: يعيد التوجيه لتسجيل الدخول إن لزم */
export async function requireDashboardUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ctx = await loadSalonContext(user.salonId);
  return { user, salon: user.salon, ctx };
}

/** للإجراءات (Server Actions): يتحقق من الجلسة والصلاحية والباقة */
export async function requireCan(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("يجب تسجيل الدخول أولاً");
  const ctx = await loadSalonContext(user.salonId);
  assertCan(user, ctx, permission);
  return { user, salon: user.salon, ctx };
}

/** نسخة لا ترمي خطأ — للصفحات التي تعرض "رقّي باقتك" بدل الرفض */
export function canUse(user: { role: Parameters<typeof roleHas>[0] }, ctx: SalonContext, permission: Permission): boolean {
  try {
    assertCan(user, ctx, permission);
    return true;
  } catch {
    return false;
  }
}
