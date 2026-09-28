import type { Metadata } from "next";
import { FeaturePageShell } from "../feature-page-shell";

export const metadata: Metadata = {
  title: "التحليلات والتقارير — دلال",
  description:
    "لوحة تقارير واضحة: الإيراد، الحضور، أفضل الخدمات، ونسب الإشغال — أرقام تقررين بها بثقة.",
};

export default function Page() {
  return <FeaturePageShell slug="reports" />;
}
