import type { Metadata } from "next";
import { FeaturePageShell } from "../feature-page-shell";

export const metadata: Metadata = {
  title: "إدارة العميلات — دلال",
  description:
    "ملف لكل عميلة: سجل الزيارات، التفضيلات، الملاحظات، وعداد الغيابات — في مكان واحد.",
};

export default function Page() {
  return <FeaturePageShell slug="clients" />;
}
