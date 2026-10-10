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
        {subtitle && <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Banner({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" | "info" }) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "info"
        ? "border-gold/30 bg-gold-soft text-brand-deep"
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
  children,
}: {
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

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-zinc-600">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
    </Card>
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
