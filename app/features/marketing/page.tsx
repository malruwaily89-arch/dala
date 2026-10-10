import type { Metadata } from "next";
import { FeaturePageShell } from "../feature-page-shell";

export const metadata: Metadata = {
  title: "التسويق والتذكيرات — دلال",
  description:
    "تذكيرات واتساب تلقائية قبل الموعد، ومتابعات وعروض تُرجع عميلاتك — من رقمك المعروف.",
};

export default function Page() {
  return <FeaturePageShell slug="marketing" />;
}
