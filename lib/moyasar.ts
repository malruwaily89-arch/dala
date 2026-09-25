import { timingSafeEqual } from "crypto";

/**
 * وحدة Moyasar — بوابة الدفع (REST API v1، وضع الاختبار)
 * تعمل فعلياً عند توفر المفاتيح؛ الصفحات تتحقق من isMoyasarConfigured()
 * وتعود لسلوك المحاكاة/التحويل اليدوي بدونها — بدون أي تعديل كود.
 *
 * المفاتيح المطلوبة في .env:
 *   MOYASAR_SECRET_KEY       مفتاح سري (sk_test_...) — للطلبات من الخادم فقط
 *   MOYASAR_PUBLISHABLE_KEY  مفتاح عام (pk_test_...) — يُستخدم في نموذج الدفع بالمتصفح
 *   MOYASAR_WEBHOOK_SECRET   القيمة السرية التي تُعرَّف في لوحة Moyasar لتأمين الـ webhook
 *
 * التوثيق: https://docs.moyasar.com/api/api-introduction
 */

const MOYASAR_API_BASE = "https://api.moyasar.com/v1";

// DEMO MODE: re-enable for production — اجعلها false وقدّم مفاتيح Moyasar الحقيقية.
// عند التفعيل تعود كل الدوال أدناه للاتصال الفعلي بـ API (الكود محفوظ دون حذف).
export const MOYASAR_DEMO_MODE = true;

export function isMoyasarConfigured(): boolean {
  if (MOYASAR_DEMO_MODE) return false; // DEMO MODE: re-enable for production
  return Boolean(process.env.MOYASAR_SECRET_KEY && process.env.MOYASAR_PUBLISHABLE_KEY);
}

export function getMoyasarPublishableKey(): string | null {
  if (MOYASAR_DEMO_MODE) return null; // DEMO MODE: re-enable for production
  return process.env.MOYASAR_PUBLISHABLE_KEY || null;
}

function authHeader(): string {
  const secret = process.env.MOYASAR_SECRET_KEY || "";
  // Basic Auth: اسم المستخدم = المفتاح السري، وكلمة المرور فارغة دائماً
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export interface MoyasarPayment {
  id: string;
  status: "initiated" | "paid" | "failed" | "authorized" | "captured" | "refunded" | "voided" | string;
  amount: number; // بالهللات (أصغر وحدة نقدية)
  currency: string;
  description?: string | null;
  invoice_id?: string | null;
  metadata?: Record<string, unknown> | null;
  source?: { type: string; company?: string; message?: string; number?: string } | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * إنشاء دفعة عبر Moyasar (عربون حجز أو اشتراك صالون)
 * source: مصدر الدفع — creditcard | token | applepay | stcpay (راجع توثيق Moyasar)
 */
export async function createPayment(params: {
  amount: number; // بالريال — يتحول تلقائياً إلى هللات
  currency?: string;
  description: string;
  callbackUrl: string;
  source: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<MoyasarPayment> {
  // DEMO MODE: re-enable for production — أرجع نتيجة وهمية بدل الاتصال بـ API.
  if (MOYASAR_DEMO_MODE) {
    return {
      id: `demo_${Date.now()}`,
      status: "paid",
      amount: Math.round(params.amount * 100),
      currency: params.currency ?? "SAR",
      description: params.description,
      metadata: params.metadata ?? null,
    };
  }

  const res = await fetch(`${MOYASAR_API_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),
      currency: params.currency ?? "SAR",
      description: params.description,
      callback_url: params.callbackUrl,
      source: params.source,
      metadata: params.metadata,
    }),
  });

  const data = (await res.json()) as MoyasarPayment & { message?: string; errors?: unknown };
  if (!res.ok) {
    throw new Error(`Moyasar رفض إنشاء الدفعة: ${data.message ?? res.status}`);
  }
  return data;
}

/** جلب حالة دفعة من Moyasar للتحقق منها من الخادم (بعد إعادة توجيه العميلة أو من الـ webhook) */
export async function fetchPayment(id: string): Promise<MoyasarPayment> {
  // DEMO MODE: re-enable for production — أرجع حالة وهمية بدل الاتصال بـ API.
  if (MOYASAR_DEMO_MODE) {
    return { id, status: "paid", amount: 0, currency: "SAR" };
  }

  const res = await fetch(`${MOYASAR_API_BASE}/payments/${id}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });

  const data = (await res.json()) as MoyasarPayment & { message?: string };
  if (!res.ok) {
    throw new Error(`تعذّر جلب حالة الدفعة من Moyasar: ${data.message ?? res.status}`);
  }
  return data;
}

/**
 * التحقق من صحة إشعار الـ webhook — Moyasar يرسل secret_token ضمن جسم الطلب
 * (وهو نفس القيمة السرية التي تُعرَّف عند إنشاء الـ webhook في لوحة Moyasar)
 * https://docs.moyasar.com/api/other/webhooks/webhook-reference
 */
export function verifyWebhookSignature(payload: { secret_token?: string | null }): boolean {
  // DEMO MODE: re-enable for production — اقبل أي توقيع أثناء التجربة.
  if (MOYASAR_DEMO_MODE) return true;

  const expected = process.env.MOYASAR_WEBHOOK_SECRET;
  const provided = payload.secret_token;
  if (!expected || !provided) return false;

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}
