import type { Metadata } from "next";
import { JourneyShell } from "./journey-shell";

export const metadata: Metadata = {
  title: "رحلة عميلة كاملة مع دلال — دلال",
  description:
    "من اكتشاف رابط الحجز إلى تأكيد وتذكير ومتابعة تلقائيين عبر واتساب — شاهدي رحلة العميلة كاملة خطوة بخطوة.",
};

export default function Page() {
  return <JourneyShell />;
}
