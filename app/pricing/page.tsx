import { REGULAR_PACKAGES, PRO_PACKAGES } from "@/lib/pricing-data";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { PricingPageShell } from "./pricing-page-shell";

export default function PricingPage() {
  return (
    <LocaleProvider>
      <PricingPageShell regular={REGULAR_PACKAGES} pro={PRO_PACKAGES} />
    </LocaleProvider>
  );
}
