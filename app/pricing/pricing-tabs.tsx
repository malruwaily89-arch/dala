"use client";

import { useState } from "react";
import { PackageCard, type Package } from "./package-card";

export function PricingTabs({ regular, pro }: { regular: Package[]; pro: Package[] }) {
  const [tab, setTab] = useState<"regular" | "pro">("regular");
  const packages = tab === "regular" ? regular : pro;

  return (
    <section className="pb-10">
      <div className="mx-auto mb-8 flex w-full max-w-sm rounded-full border border-[#c9a84c]/20 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("regular")}
          className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
            tab === "regular" ? "bg-brand text-white shadow" : "text-zinc-500"
          }`}
        >
          الباقات العادية
        </button>
        <button
          type="button"
          onClick={() => setTab("pro")}
          className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
            tab === "pro"
              ? "bg-[#c9a84c] text-[#1a0a2e] shadow"
              : "text-zinc-500"
          }`}
        >
          الباقات برو ✨
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((p) => (
          <PackageCard key={p.name} p={p} />
        ))}
      </div>
    </section>
  );
}
