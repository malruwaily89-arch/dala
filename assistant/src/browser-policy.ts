export type Sensitivity = "normal" | "submit" | "personal" | "payment" | "password";

export interface ControlInfo {
  tag: string;
  type?: string;
  name?: string;
  id?: string;
  autocomplete?: string;
  label?: string;
}

// Confirming or sending something: the owner approves first.
const SUBMIT_TEXT = /تأكيد|تاكيد|إرسال|ارسال|حجز|اطلب|متابعة|submit|send|book|order|confirm|continue/i;
// Paying or buying: never clicked, whatever the owner says.
const PAY_TEXT = /شراء|اشتر|ادفع|دفع|\bpay\b|\bbuy\b|\bpurchase\b|checkout/i;
const PASSWORD_FIELD = /password|passwd|passcode|\bpin\b|\botp\b|كلمة المرور|كلمه المرور|كلمة السر|كلمه السر|الرقم السري|رمز التحقق|رمز الدخول/i;
const PASSWORD_AUTOCOMPLETE = /^(current-password|new-password|one-time-code)$/;
const PAYMENT_FIELD = /card|cvv|cvc|cvn|iban|expir|بطاقة|بطاقه|كارت|سي في سي|آيبان|أيبان|ايبان/i;
const PERSONAL_FIELD = /phone|mobile|e-?mail|\bname\b|national|identity|address|جوال|هاتف|بريد|اسم|هوية|عنوان/i;
const PERSONAL_AUTOCOMPLETE = /^(email|tel|name|given-name|family-name|street-address|postal-code|bday)$/;
const PAYMENT_SEGMENT = /^(checkout|payment|payments|pay|billing)$|دفع/i;
const PAYMENT_HOST =
  /(^|\.)(moyasar\.com|tap\.company|hyperpay\.com|payfort\.com|stripe\.com|paypal\.com|checkout\.com|sadad\.com\.sa|mada\.com\.sa|stcpay\.com\.sa|tabby\.ai|tamara\.co|paytabs\.com|applepay\.com)$/i;

/** Text boxes, not buttons or links: only these hold what the owner types. */
export function isTextField(c: ControlInfo): boolean {
  const type = (c.type ?? "").toLowerCase();
  return (c.tag === "input" && !["submit", "button", "image", "reset"].includes(type)) || c.tag === "textarea" || c.tag === "select";
}

export function classifyControl(c: ControlInfo): Sensitivity {
  const type = (c.type ?? "").toLowerCase();
  const auto = (c.autocomplete ?? "").toLowerCase();
  const label = c.label ?? "";
  const fieldText = [c.name, c.id, label].filter(Boolean).join(" ");
  const textField = isTextField(c);
  if (type === "password" || PASSWORD_AUTOCOMPLETE.test(auto) || (textField && PASSWORD_FIELD.test(fieldText))) return "password";
  if (auto.startsWith("cc-") || (textField && PAYMENT_FIELD.test(fieldText))) return "payment";
  if (!textField && PAY_TEXT.test(label)) return "payment";
  if (c.tag === "input" && (type === "submit" || type === "image")) return "submit";
  if (SUBMIT_TEXT.test(label)) return "submit";
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
  if (PAYMENT_HOST.test(hostOf(page.url))) return true;
  if (pathSegments(page.url).some((s) => PAYMENT_SEGMENT.test(s))) return true;
  return page.frameUrls.some((u) => PAYMENT_HOST.test(hostOf(u)));
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function pathSegments(url: string): string[] {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return [];
  }
  return pathname
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s).toLowerCase();
      } catch {
        return s.toLowerCase();
      }
    });
}
