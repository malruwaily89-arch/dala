export type Sensitivity = "normal" | "submit" | "personal" | "payment" | "password";

export interface ControlInfo {
  tag: string;
  type?: string;
  name?: string;
  id?: string;
  autocomplete?: string;
  label?: string;
}

const SUBMIT_TEXT =
  /تأكيد|تاكيد|إرسال|ارسال|حجز|شراء|اشتر|دفع|ادفع|اطلب|متابعة|submit|send|book|buy|order|pay|checkout|confirm|continue/i;
const PAYMENT_FIELD = /card|cvv|cvc|iban|كارت|بطاقة|سي في سي/i;
const PERSONAL_FIELD = /phone|mobile|e-?mail|\bname\b|national|identity|address|جوال|هاتف|بريد|اسم|هوية|عنوان/i;
const PERSONAL_AUTOCOMPLETE = /^(email|tel|name|given-name|family-name|street-address|postal-code|bday)$/;
const PAYMENT_PATH = /checkout|payment|pay|billing|card|دفع|الدفع/i;
const PAYMENT_HOSTS = /(moyasar|tap\.company|hyperpay|stripe|paypal|checkout\.com|payfort)/i;

export function classifyControl(c: ControlInfo): Sensitivity {
  const type = (c.type ?? "").toLowerCase();
  const auto = (c.autocomplete ?? "").toLowerCase();
  const fieldText = [c.name, c.id, c.label].filter(Boolean).join(" ");
  if (type === "password") return "password";
  if (auto.startsWith("cc-") || PAYMENT_FIELD.test(fieldText)) return "payment";
  if (c.tag === "input" && (type === "submit" || type === "image")) return "submit";
  if (SUBMIT_TEXT.test(c.label ?? "")) return "submit";
  if (type === "email" || type === "tel" || PERSONAL_AUTOCOMPLETE.test(auto) || PERSONAL_FIELD.test(fieldText)) {
    return "personal";
  }
  return "normal";
}

export interface PageFacts {
  url: string;
  hasCardFields: boolean;
  frameUrls: string[];
}

export function isPaymentPage(page: PageFacts): boolean {
  if (page.hasCardFields) return true;
  if (PAYMENT_PATH.test(pathOf(page.url))) return true;
  return page.frameUrls.some((u) => PAYMENT_HOSTS.test(hostOf(u)));
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

/** A host is allowed when it equals an approved host or is a subdomain of one. */
export function isHostApproved(host: string, approved: readonly string[]): boolean {
  const h = host.toLowerCase();
  return approved.some((a) => h === a || h.endsWith(`.${a}`));
}
