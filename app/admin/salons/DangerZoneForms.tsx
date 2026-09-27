"use client";

import { deleteSalonAction, deleteUserAction } from "@/app/actions/admin";

export function DeleteSalonForm({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  return (
    <form
      action={deleteSalonAction}
      onSubmit={(e) => {
        const ok = confirm(
          `تأكيد حذف صالون "${tenantName}" نهائياً؟\nسيُحذف كل شيء تابع له (المستخدمون، المواعيد، العميلات، الرسائل، الفواتير) ولا يمكن التراجع عن هذا الإجراء.`
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      <button className="w-full rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-800">
        حذف الصالون نهائياً
      </button>
    </form>
  );
}

export function DeleteUserForm({ userId, userEmail }: { userId: string; userEmail: string }) {
  return (
    <form
      action={deleteUserAction}
      onSubmit={(e) => {
        const ok = confirm(`تأكيد حذف حساب المستخدم "${userEmail}" فقط (بدون حذف بيانات الصالون)؟`);
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
        حذف حساب المالكة فقط
      </button>
    </form>
  );
}
