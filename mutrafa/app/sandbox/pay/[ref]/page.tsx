import { notFound } from "next/navigation";
import { sandboxPaymentsAllowed } from "@/lib/env";
import { db } from "@/lib/db";
import { formatSar } from "@/lib/money";
import { sandboxResultAction } from "@/app/actions/sandbox";
import { Card, btnPrimary, btnGhost } from "@/components/ui";

export const metadata = { title: "بوابة دفع تجريبية" };

/** صفحة دفع تجريبية (وضع sandbox): لا تُحصّل أي مبلغ حقيقي */
export default async function SandboxPayPage({ params }: { params: Promise<{ ref: string }> }) {
  if (!sandboxPaymentsAllowed()) notFound();
  const { ref } = await params;
  const payment = await db.payment.findUnique({ where: { providerRef: ref }, include: { salon: true } });
  if (!payment) notFound();

  const paid = payment.status === "PAID";
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-900">
        وضع تجريبي (Sandbox) — لا يتم تحصيل أي مبلغ حقيقي. لا تُدخلي بيانات بطاقة حقيقية.
      </div>
      <Card>
        <p className="text-sm text-zinc-600">{payment.salon.name}</p>
        <p className="mt-1 text-sm font-bold text-brand">مُترَفة</p>
        <p className="mt-6 text-center font-serif text-4xl font-bold text-ink">{formatSar(payment.amountHalalas)}</p>

        {paid ? (
          <p className="mt-8 rounded-xl bg-emerald-50 p-4 text-center font-bold text-emerald-800">تم الدفع مسبقاً ✅</p>
        ) : (
          <form action={sandboxResultAction} className="mt-8 space-y-4">
            <input type="hidden" name="ref" value={ref} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">طريقة الدفع</span>
              <select name="method" defaultValue="mada" className="w-full rounded-xl border border-zinc-300 px-3 py-2.5">
                <option value="mada">مدى</option>
                <option value="visa">Visa / Mastercard</option>
                <option value="applepay">Apple Pay</option>
                <option value="googlepay">Google Pay</option>
              </select>
            </label>
            <button name="outcome" value="paid" className={`${btnPrimary} w-full`}>ادفعي {formatSar(payment.amountHalalas)}</button>
            <button name="outcome" value="failed" className={`${btnGhost} w-full`}>محاكاة فشل الدفع</button>
          </form>
        )}
      </Card>
    </div>
  );
}
