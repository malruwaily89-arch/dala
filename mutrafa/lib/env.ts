/** كل قراءات البيئة في مكان واحد — تُقرأ عند الاستخدام لا عند التحميل (لسهولة الاختبار) */

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function paymentMode(): "sandbox" | "moyasar" {
  return process.env.PAYMENT_MODE === "moyasar" ? "moyasar" : "sandbox";
}

/**
 * الدفع التجريبي يُحصّل صفراً من المال ويعتمد الدفعة فوراً، لذلك يُمنع في الإنتاج
 * إلا بتفعيل صريح ALLOW_SANDBOX_PAYMENTS=true (للتجارب الداخلية فقط).
 */
export function sandboxPaymentsAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ALLOW_SANDBOX_PAYMENTS === "true";
}

export function bookingUrl(slug: string): string {
  return `${appUrl()}/${slug}`;
}
