import { randomBytes } from "crypto";

/**
 * وحدة البريد الإلكتروني — تفعيل الحساب عبر Resend (https://resend.com)
 * تعمل فعلياً عند توفر RESEND_API_KEY في .env؛ وإلا تبقى في وضع المحاكاة
 * (تُسجَّل رابط التفعيل بسجلات الخادم فقط) بدون أي تعديل كود.
 *
 * المتغيرات المطلوبة في .env:
 *   RESEND_API_KEY    مفتاح API من لوحة Resend (Settings → API Keys)
 *   EMAIL_FROM        عنوان المرسل، مثال: "دلال <noreply@d-alal.com>"
 *                      (يتطلب إضافة الدومين والتحقق منه في Resend → Domains؛
 *                       بدونه Resend يسمح بالإرسال من onboarding@resend.dev فقط)
 *   APP_BASE_URL      رابط الموقع الأساسي، مثال: https://d-alal.com
 */

const RESEND_API_BASE = "https://api.resend.com";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function generateVerifyToken(): string {
  return randomBytes(32).toString("hex");
}

function getBaseUrl(): string {
  return process.env.APP_BASE_URL || "https://d-alal.com";
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "دلال <onboarding@resend.dev>";
}

/** يرسل إيميل تفعيل الحساب — أو يسجّل رابط المحاكاة بالسجلات إذا لم تُضبط مفاتيح Resend بعد */
export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const verifyUrl = `${getBaseUrl()}/api/verify-email?token=${token}`;

  if (!isEmailConfigured()) {
    console.log(`[email] وضع المحاكاة — لا يوجد RESEND_API_KEY. رابط التفعيل لـ ${to}:\n${verifyUrl}`);
    return;
  }

  const res = await fetch(`${RESEND_API_BASE}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject: "فعّلي بريدك الإلكتروني — دلال",
      html: `
        <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${getBaseUrl()}/dala-logo-option-a.png" alt="دلال" width="120" style="display:inline-block;" />
          </div>
          <h2 style="color:#4a1f28;">مرحباً بك في دلال 👋</h2>
          <p style="color:#333;font-size:15px;line-height:1.7;">
            بقي خطوة وحدة بس — فعّلي بريدك الإلكتروني عشان تفعّلي كل مزايا حسابك.
          </p>
          <p style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}"
               style="background:#4a1f28;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block;">
              تفعيل البريد الإلكتروني
            </a>
          </p>
          <p style="color:#999;font-size:12px;">
            إذا لم يعمل الزر، انسخي هذا الرابط وضعيه بالمتصفح:<br>
            <span style="direction:ltr;display:inline-block;">${verifyUrl}</span>
          </p>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            هذا الرابط صالح لمدة 24 ساعة. إذا لم تطلبي هذا التسجيل، تجاهلي هذه الرسالة.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend رفض إرسال الإيميل: ${res.status} ${errText}`);
  }
}
