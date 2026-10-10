import type { Metadata } from "next";
import { FeaturePageShell } from "../feature-page-shell";

export const metadata: Metadata = {
  title: "الحجز الإلكتروني — دلال",
  description:
    "صفحة حجز باسم علامتك: تختار العميلة الخدمة والوقت، تدفع العربون، ويتأكد الحجز فوراً.",
};

export default function Page() {
  return <FeaturePageShell slug="booking" />;
}
