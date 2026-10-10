import Link from "next/link";
import type { ReactNode } from "react";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-deep focus-visible:outline-gold disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-brand/25 bg-white px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-soft";
export const btnDanger =
  "inline-flex items-center justify-center rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50";
export const inputCls =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-ink transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-brand/10 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand md:text-3xl">{title}</h1>
        <span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-l from-gold to-brand/30" aria-hidden />
        {subtitle && <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Banner({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info" | "warning";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "info"
        ? "border-gold/30 bg-gold-soft text-brand-deep"
        : tone === "warning"
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-rose-200 bg-rose-50 text-rose-800";
  return <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${cls}`}>{children}</div>;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand/25 bg-white/60 p-10 text-center text-sm text-zinc-600">
      {children}
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  dir,
  hint,
  step,
  children,
}: {
  step?: number;
  label: string;
  name?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  dir?: "ltr" | "rtl";
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children ?? (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          dir={dir ?? (type === "tel" || type === "email" ? "ltr" : undefined)}
          step={step}
          className={inputCls}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

/** حقل جوال: رمز +966 ثابت، و9 أرقام تبدأ بـ 5 */
export function PhoneField({
  name,
  label = "رقم الجوال",
  defaultValue,
  required = true,
}: {
  name: string;
  label?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <span dir="ltr" className="flex">
        <span className="flex items-center rounded-s-xl border border-e-0 border-zinc-300 bg-zinc-50 px-3 text-sm font-bold text-zinc-600">+966</span>
        <input
          name={name}
          type="tel"
          inputMode="numeric"
          pattern="5[0-9]{8}"
          maxLength={9}
          required={required}
          placeholder="5XXXXXXXX"
          defaultValue={defaultValue}
          className={`${inputCls} rounded-s-none`}
        />
      </span>
      <span className="mt-1 block text-xs text-zinc-500">9 أرقام بعد رمز الدولة، تبدأ بالرقم 5</span>
    </label>
  );
}

/** ألوان المؤشرات: كل لون له معنى ثابت في كل الصفحات */
export const STAT_TONES = {
  brand: { bar: "bg-brand", value: "text-brand" },
  gold: { bar: "bg-gold", value: "text-gold" },
  emerald: { bar: "bg-emerald-500", value: "text-emerald-700" },
  amber: { bar: "bg-amber-500", value: "text-amber-700" },
  sky: { bar: "bg-sky-500", value: "text-sky-700" },
  rose: { bar: "bg-rose-500", value: "text-rose-700" },
} as const;

export type StatTone = keyof typeof STAT_TONES;

export function Stat({ label, value, note, tone = "brand" }: { label: string; value: string; note?: string; tone?: StatTone }) {
  const t = STAT_TONES[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/10 bg-white p-5 shadow-sm">
      <span className={`absolute inset-y-0 start-0 w-1.5 ${t.bar}`} aria-hidden />
      <p className="text-sm font-semibold text-zinc-600">{label}</p>
      <p className={`mt-1 whitespace-nowrap font-serif text-2xl font-bold md:text-3xl ${t.value}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
    </div>
  );
}

/** رابط مع تنسيق الزر الثانوي */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
