"use client";

import { useId, useRef, useState, type DragEvent } from "react";

/**
 * منطقة رفع ملف مُصمَّمة بدل خانة المتصفح الافتراضية.
 * الإدخال الأصلي مخفي بصرياً لكنه يبقى قابلاً للتركيز بلوحة المفاتيح، ويُعرض التركيز على المنطقة نفسها.
 * يدعم السحب والإفلات، ويُظهر اسم الملف المختار وحجمه.
 */
export function FileField({
  name,
  label,
  accept,
  required,
  hint,
}: {
  name: string;
  /** الاسم الذي يقرؤه قارئ الشاشة للحقل */
  label: string;
  accept: string;
  required?: boolean;
  /** نص مساعد يظهر قبل اختيار الملف */
  hint?: string;
}) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped || !inputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(dropped);
    inputRef.current.files = transfer.files;
    setFile(dropped);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className="relative"
    >
      <input
        ref={inputRef}
        id={uid}
        type="file"
        name={name}
        accept={accept}
        required={required}
        aria-label={label}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="peer sr-only"
      />
      <label
        htmlFor={uid}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
          dragging
            ? "border-brand bg-brand-soft"
            : file
              ? "border-gold/50 bg-gold-soft/50 hover:border-brand/50"
              : "border-brand/30 bg-white hover:border-brand/60 hover:bg-brand-soft/40"
        }`}
      >
        <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4m0 0-4 4m4-4 4 4" />
            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
        </span>

        {file ? (
          <span className="min-w-0 max-w-full">
            <span dir="auto" className="block truncate text-sm font-bold text-ink">{file.name}</span>
            <span className="mt-0.5 block text-xs text-zinc-600">{Math.max(1, Math.round(file.size / 1024))} كيلوبايت · تم اختيار الملف</span>
          </span>
        ) : (
          <span className="block">
            <span className="block text-sm font-bold text-ink">اسحبي الملف هنا أو اضغطي للاختيار</span>
            {hint && <span className="mt-0.5 block text-xs text-zinc-600">{hint}</span>}
          </span>
        )}

        <span className="inline-flex items-center justify-center rounded-full border border-brand/25 bg-white px-5 py-2 text-sm font-bold text-brand shadow-sm">
          {file ? "تغيير الملف" : "اختيار ملف"}
        </span>
      </label>
    </div>
  );
}
