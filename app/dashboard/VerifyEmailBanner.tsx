"use client";

import { useSearchParams } from "next/navigation";
import { resendVerificationAction } from "@/app/actions/auth";

export function VerifyEmailBanner({ email }: { email: string }) {
  const searchParams = useSearchParams();
  const sent = searchParams.get("verify_sent") === "1";
  const error = searchParams.get("verify_error");

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div>
        <p className="text-sm font-bold text-amber-800">لم يتم تفعيل بريدك الإلكتروني بعد</p>
        <p dir="ltr" className="text-xs text-amber-700">{email}</p>
        {sent && <p className="mt-1 text-xs font-semibold text-emerald-700">تم إرسال رابط جديد ✅ تفقّدي بريدك.</p>}
        {error === "too_many" && (
          <p className="mt-1 text-xs font-semibold text-rose-700">طلبات كثيرة، حاولي بعد قليل.</p>
        )}
        {error === "1" && (
          <p className="mt-1 text-xs font-semibold text-rose-700">تعذّر إرسال الإيميل، حاولي مرة أخرى لاحقاً.</p>
        )}
      </div>
      <form action={resendVerificationAction}>
        <button className="rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700">
          إعادة إرسال رابط التفعيل
        </button>
      </form>
    </div>
  );
}
