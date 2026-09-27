type CurrentUser = NonNullable<Awaited<ReturnType<typeof import("./auth").getCurrentUser>>>;

/**
 * صلاحيات حساب الموظفة (role=STAFF) — قابلة للمنح والمنع من لوحة المالكة.
 * المالكة (OWNER) والسوبر أدمن مسموح لهم دائماً بكل شي، بدون أي قيد.
 * التقارير والأرقام المالية مقيدة دائماً على المالكة فقط — لا يوجد تبديل لها.
 */
export function canCancelAppointments(user: CurrentUser): boolean {
  return user.role !== "STAFF" || user.canCancelAppointments;
}

export function canAddAppointments(user: CurrentUser): boolean {
  return user.role !== "STAFF" || user.canAddAppointments;
}

export function canViewAppointmentStatus(user: CurrentUser): boolean {
  return user.role !== "STAFF" || user.canViewAppointmentStatus;
}

export function canManageStaffSchedules(user: CurrentUser): boolean {
  return user.role !== "STAFF" || user.canManageStaffSchedules;
}

/** التقارير والبيانات المالية — للمالكة والسوبر أدمن فقط، بلا استثناء */
export function canViewReportsAndFinance(user: CurrentUser): boolean {
  return user.role !== "STAFF";
}

export function isStaffAccount(user: CurrentUser): boolean {
  return user.role === "STAFF";
}
