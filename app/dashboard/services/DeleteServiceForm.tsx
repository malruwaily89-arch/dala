"use client";

import { deleteServiceAction } from "@/app/actions/appointments";

export function DeleteServiceForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteServiceAction}
      onSubmit={(e) => {
        if (!confirm(`تأكيد حذف خدمة "${name}" نهائياً؟`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
        حذف
      </button>
    </form>
  );
}
