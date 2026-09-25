"use client";

import { useState } from "react";
import { submitRatingAction } from "./actions";

export function RatingForm({ slug, code }: { slug: string; code: string }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <form action={submitRatingAction} className="mt-6 rounded-[28px] border border-pink-100 bg-pink-50/60 p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="score" value={score} />

      <p className="text-center text-sm font-extrabold text-zinc-800">كيف كانت تجربتك معنا؟</p>

      <div dir="ltr" className="mt-4 flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl leading-none transition"
            aria-label={`${n} نجوم`}
          >
            <span style={{ color: n <= (hover || score) ? "var(--brand)" : "#f1cfe0" }}>★</span>
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={3}
        placeholder="تعليقك (اختياري)"
        className="mt-4 w-full rounded-[20px] border-2 border-pink-100 bg-white px-4 py-3 text-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-4"
        style={{ "--tw-ring-color": "color-mix(in srgb, var(--brand) 15%, transparent)" } as React.CSSProperties}
      />

      <button
        type="submit"
        disabled={score === 0}
        className="mt-4 w-full rounded-full py-3.5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-40"
        style={{
          backgroundColor: "var(--brand)",
          boxShadow: "0 12px 30px -8px color-mix(in srgb, var(--brand) 45%, transparent)",
        }}
      >
        إرسال التقييم
      </button>
    </form>
  );
}
