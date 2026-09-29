"use client";

import {
  createStaffLoginAction,
  updateStaffPermissionsAction,
  deleteStaffLoginAction,
} from "@/app/actions/staff-accounts";

const PERMISSIONS: { name: string; label: string }[] = [
  { name: "canCancelAppointments", label: "إلغاء موعد" },
  { name: "canAddAppointments", label: "إضافة موعد جديد" },
  { name: "canViewAppointmentStatus", label: "معرفة حالة الموعد (مؤكد أم لا)" },
  { name: "canManageStaffSchedules", label: "الاطلاع على جدول الموظفات وتعديله" },
];

function PermissionCheckboxes({
  defaults,
}: {
  defaults?: Partial<Record<string, boolean>>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PERMISSIONS.map((p) => (
        <label key={p.name} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={p.name} defaultChecked={defaults?.[p.name] ?? false} className="accent-brand" />
          {p.label}
        </label>
      ))}
    </div>
  );
}

/** ملاحظة توضيحية بدل مربعات الصلاحيات للمسميات غير الإدارية */
function RestrictedNote() {
  return (
    <p className="rounded-lg bg-background p-3 text-xs text-foreground/55">
      هذا الحساب يسمح فقط بالاطلاع على جدولها الخاص. لمنح صلاحيات إضافية (إضافة/إلغاء مواعيد،
      إدارة جداول الموظفات)، غيّري مسمّاها الوظيفي إلى «موظفة استقبال» أو «مشرفة» أو «إدارية».
    </p>
  );
}

export function CreateStaffLoginForm({ staffId, restricted }: { staffId: string; restricted: boolean }) {
  return (
    <form action={createStaffLoginAction} className="space-y-3">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="flex flex-wrap gap-3">
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-semibold">البريد الإلكتروني</span>
          <input
            name="email"
            type="email"
            dir="ltr"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-semibold">كلمة المرور</span>
          <input
            name="password"
            type="password"
            dir="ltr"
            minLength={6}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
      </div>
      {restricted ? (
        <RestrictedNote />
      ) : (
        <>
          <p className="text-xs font-bold text-foreground/55">الصلاحيات الممنوحة</p>
          <PermissionCheckboxes />
        </>
      )}
      <button className="rounded-full bg-brand px-5 py-2 text-xs font-bold text-white hover:opacity-90">
        إنشاء حساب الدخول
      </button>
    </form>
  );
}

export function EditStaffPermissionsForm({
  userId,
  email,
  permissions,
  restricted,
}: {
  userId: string;
  email: string;
  permissions: Record<string, boolean>;
  restricted: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-foreground/55">
        حساب الدخول: <span dir="ltr" className="font-semibold text-foreground/75">{email}</span>
      </p>
      {restricted ? (
        <RestrictedNote />
      ) : (
        <form action={updateStaffPermissionsAction} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <PermissionCheckboxes defaults={permissions} />
          <button className="rounded-full bg-zinc-800 px-5 py-2 text-xs font-bold text-white hover:opacity-90">
            حفظ الصلاحيات
          </button>
        </form>
      )}
      <form
        action={deleteStaffLoginAction}
        onSubmit={(e) => {
          if (!confirm("تأكيد حذف حساب الدخول هذا؟ الموظفة نفسها تبقى بالنظام، بس ما تقدر تسجل دخول بعدها.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
          حذف حساب الدخول
        </button>
      </form>
    </div>
  );
}
