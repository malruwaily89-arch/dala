"use client";

import { useLocale } from "@/lib/i18n/locale-context";

export type BillingPeriod = {
  months: number;
  discount: number;
  labelKey: "period1" | "period3" | "period6" | "period9" | "period12";
};

export const BILLING_PERIODS: BillingPeriod[] = [
  { months: 1, discount: 0, labelKey: "period1" },
  { months: 3, discount: 5, labelKey: "period3" },
  { months: 6, discount: 10, labelKey: "period6" },
  { months: 9, discount: 15, labelKey: "period9" },
  { months: 12, discount: 20, labelKey: "period12" },
];

export function BillingPeriodPicker({
  months,
  onChange,
}: {
  months: number;
  onChange: (months: number) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand/60">
        {t.pricingPage.periodLabel}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {BILLING_PERIODS.map((p) => {
          const active = months === p.months;
          return (
            <button
              key={p.months}
              type="button"
              onClick={() => onChange(p.months)}
              className={`relative flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "border-brand bg-brand text-white shadow-md"
                  : "border-brand-gold/20 bg-white text-brand/70 hover:border-brand-gold"
              }`}
            >
              {t.pricingPage[p.labelKey]}
              {p.discount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    active ? "bg-brand-gold text-brand" : "bg-brand-gold/15 text-brand-gold"
                  }`}
                >
                  {t.pricingPage.periodDiscount.replace("{percent}", String(p.discount))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
