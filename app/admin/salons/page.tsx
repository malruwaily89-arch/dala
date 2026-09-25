import {
  getSalonsForManagement,
  createSalonAction,
  updateSalonPlanAction,
  updateSalonStatusAction,
  recordManualPaymentAction,
} from "@/app/actions/admin";

const PLANS = ["BASIC", "PRO", "ADVANCED", "BASIC_PRO", "PRO_PRO", "ADVANCED_PRO"];

export default async function SalonsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const salons = await getSalonsForManagement();
  const { ok, error } = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">إدارة الصالونات</h1>
        <p className="mt-1 text-sm text-zinc-500">إضافة صالون جديد أو تعديل باقته أو حالة اشتراكه.</p>
      </div>

      {ok && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          تم تنفيذ الإجراء بنجاح.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error === "exists" ? "الرابط أو البريد مستخدم مسبقاً." : "تحقق من الحقول المطلوبة."}
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">إضافة صالون جديد</h2>
        <form action={createSalonAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">اسم الصالون</span>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">الرابط (slug)</span>
            <input
              name="slug"
              required
              dir="ltr"
              placeholder="my-salon"
              pattern="[a-z0-9-]{3,40}"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">الهاتف</span>
            <input
              name="phone"
              required
              dir="ltr"
              placeholder="05xxxxxxxx"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">بريد المالكة</span>
            <input
              name="email"
              type="email"
              required
              dir="ltr"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">كلمة المرور</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              dir="ltr"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-zinc-700">الباقة</span>
            <select
              name="plan"
              defaultValue="BASIC"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button className="rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
              إضافة الصالون
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">الصالونات ({salons.length})</h2>
        <div className="mt-4 space-y-3">
          {salons.map((s) => (
            <details key={s.id} className="rounded-lg border border-zinc-200 p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{s.name}</span>
                <span dir="ltr" className="text-xs text-zinc-400">/b/{s.slug}</span>
                <span className="text-xs text-zinc-500">{s.ownerEmail}</span>
                <span className="text-xs font-semibold">{s.plan}</span>
                {statusBadge(s.status)}
              </summary>

              <div className="mt-4 grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-3">
                {/* تعديل الباقة */}
                <form action={updateSalonPlanAction} className="space-y-2">
                  <input type="hidden" name="subscriptionId" value={s.subscriptionId ?? ""} />
                  <p className="text-xs font-bold text-zinc-500">تعديل الباقة</p>
                  <div className="flex gap-2">
                    <select
                      name="plan"
                      defaultValue={PLANS.includes(s.plan) ? s.plan : "BASIC"}
                      className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <button
                      disabled={!s.subscriptionId}
                      className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                    >
                      حفظ
                    </button>
                  </div>
                </form>

                {/* حالة الاشتراك */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-500">حالة الاشتراك</p>
                  <div className="flex flex-wrap gap-2">
                    {s.status !== "active" && (
                      <StatusForm subscriptionId={s.subscriptionId} status="active" label="تنشيط" color="bg-emerald-600" />
                    )}
                    {s.status !== "suspended" && (
                      <StatusForm subscriptionId={s.subscriptionId} status="suspended" label="تعليق" color="bg-amber-600" />
                    )}
                    {s.status !== "canceled" && (
                      <StatusForm subscriptionId={s.subscriptionId} status="canceled" label="إلغاء" color="bg-rose-600" />
                    )}
                  </div>
                </div>

                {/* دفعة يدوية */}
                <form action={recordManualPaymentAction} className="space-y-2">
                  <input type="hidden" name="tenantId" value={s.id} />
                  <input type="hidden" name="subscriptionId" value={s.subscriptionId ?? ""} />
                  <p className="text-xs font-bold text-zinc-500">تسجيل دفعة يدوية</p>
                  <div className="flex gap-2">
                    <input
                      name="amount"
                      type="number"
                      min={1}
                      step="0.01"
                      placeholder="المبلغ (ر.س)"
                      required
                      dir="ltr"
                      className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                    />
                    <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
                      تسجيل
                    </button>
                  </div>
                </form>
              </div>
            </details>
          ))}
          {salons.length === 0 && (
            <p className="py-8 text-center text-zinc-400">لا توجد صالونات بعد.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusForm({
  subscriptionId,
  status,
  label,
  color,
}: {
  subscriptionId: string | null;
  status: string;
  label: string;
  color: string;
}) {
  return (
    <form action={updateSalonStatusAction}>
      <input type="hidden" name="subscriptionId" value={subscriptionId ?? ""} />
      <input type="hidden" name="status" value={status} />
      <button
        disabled={!subscriptionId}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 ${color}`}
      >
        {label}
      </button>
    </form>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    trialing: "bg-sky-100 text-sky-800",
    past_due: "bg-amber-100 text-amber-800",
    suspended: "bg-orange-100 text-orange-800",
    canceled: "bg-zinc-100 text-zinc-600",
  };
  const label: Record<string, string> = {
    active: "نشط",
    trialing: "تجريبي",
    past_due: "متأخر",
    suspended: "معلّق",
    canceled: "ملغي",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-zinc-100"}`}>
      {label[status] ?? status}
    </span>
  );
}
