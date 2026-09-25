"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await loginAction(formData);
      router.refresh();
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-2xl font-extrabold text-brand">
          دلال
        </Link>
        <h1 className="mt-6 text-xl font-bold">تسجيل دخول الصالون</h1>
        <p className="mt-1 text-sm text-zinc-500">أدخلي بيانات حسابك للوصول إلى لوحة التحكم.</p>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error === "invalid" ? "البريد أو كلمة المرور غير صحيحة." : "يرجى تعبئة جميع الحقول."}
          </p>
        )}

        <form action={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
              placeholder="you@salon.sa"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-brand py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}
