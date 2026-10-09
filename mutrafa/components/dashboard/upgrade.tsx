import Link from "next/link";
import { Card, btnPrimary } from "../ui";
import { PLANS, type Feature, minimumPlanFor } from "@/lib/plans";

const FEATURE_TITLE: Record<Feature, string> = {
  "waitlist.manual": "قائمة الانتظار",
  "waitlist.auto": "قائمة الانتظار التلقائية",
  "cancellation.perService": "سياسة إلغاء لكل خدمة",
  commission: "حساب العمولات",
  roles: "صلاحيات متعددة الأدوار",
  "audit.view": "سجل التدقيق",
};

/** بطاقة ترقية تظهر بدل ميزة مقفلة بالباقة الحالية */
export function UpgradeCard({ feature }: { feature: Feature }) {
  const plan = PLANS[minimumPlanFor(feature)];
  return (
    <Card className="border-gold/40 bg-gradient-to-l from-gold-soft to-white">
      <p className="font-serif text-lg font-bold text-brand">{FEATURE_TITLE[feature]}</p>
      <p className="mt-1 text-sm text-zinc-700">
        هذه الميزة متاحة من باقة <strong>{plan.nameAr}</strong> فما فوق.
      </p>
      <Link href="/dashboard/billing" className={`${btnPrimary} mt-4`}>
        رقّي باقتك
      </Link>
    </Card>
  );
}
