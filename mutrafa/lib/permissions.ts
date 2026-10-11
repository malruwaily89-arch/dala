import type { Role } from "@prisma/client";
import type { Feature } from "./plans";

/**
 * صلاحيات لوحة التحكم حسب الدور، مع بوابة الباقة.
 * الدور وحده لا يكفي: بعض الصلاحيات تتطلب ميزة في الباقة (مثلاً العمولات تتطلب الذهبية).
 * أي إجراء في الخادم يجب أن يمر عبر can() — لا تعتمد الواجهة على إخفاء الأزرار وحدها.
 */

export const PERMISSIONS = [
  "appointments.manage",
  "customers.manage",
  "services.manage",
  "calendars.manage",
  "waitlist.manage",
  "reports.view",
  "commission.view",
  "settings.manage",
  "team.manage",
  "billing.manage",
  "audit.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  MANAGER: [
    "appointments.manage",
    "customers.manage",
    "services.manage",
    "calendars.manage",
    "waitlist.manage",
    "reports.view",
    "commission.view",
    "settings.manage",
  ],
  RECEPTIONIST: ["appointments.manage", "customers.manage", "waitlist.manage"],
};

/** الميزة المطلوبة من الباقة لكل صلاحية (إن وُجدت) */
const PERMISSION_FEATURE: Partial<Record<Permission, Feature>> = {
  "waitlist.manage": "waitlist.manual",
  "commission.view": "commission",
  "audit.view": "audit.view",
};

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionFeature(permission: Permission): Feature | undefined {
  return PERMISSION_FEATURE[permission];
}

/** الأدوار المتاحة في الباقة: الأدوار المتعددة تتطلب ميزة "roles" (الذهبية وما فوق) */
export function assignableRoles(hasRolesFeature: boolean): Role[] {
  return hasRolesFeature ? ["OWNER", "MANAGER", "RECEPTIONIST"] : ["OWNER"];
}

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "مالكة",
  MANAGER: "مشرفة",
  RECEPTIONIST: "استقبال",
};
