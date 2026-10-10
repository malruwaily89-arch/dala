import type { Metadata } from "next";
import { FeaturePageShell } from "../feature-page-shell";

export const metadata: Metadata = {
  title: "المدفوعات والعرابين — دلال",
  description:
    "عربون إلكتروني يحصَّل قبل الموعد ويصل حسابك مباشرة، مع تقارير تحصيل واضحة.",
};

export default function Page() {
  return <FeaturePageShell slug="payments" />;
}
