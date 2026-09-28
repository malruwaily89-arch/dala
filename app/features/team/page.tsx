import type { Metadata } from "next";
import { FeaturePageShell } from "../feature-page-shell";

export const metadata: Metadata = {
  title: "الفريق والتقويم — دلال",
  description:
    "أديري أخصائياتك ومناوباتهن وتقويم المواعيد من مكان واحد — بدون تعارض ولا ازدواج حجز.",
};

export default function Page() {
  return <FeaturePageShell slug="team" />;
}
