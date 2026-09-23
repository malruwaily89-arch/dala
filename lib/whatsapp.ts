import { db } from "./db";

/**
 * وحدة واتساب — Meta WhatsApp Cloud API (Graph API v21.0)
 * عند توفر المفاتيح يُرسل فعلياً؛ وإلا يبقى في وضع المحاكاة (MessageLog فقط)
 * المفاتيح المطلوبة في .env:
 *   WHATSAPP_ACCESS_TOKEN      رمز الوصول (مؤقت للتجربة من Meta Developer Portal)
 *   WHATSAPP_PHONE_NUMBER_ID   معرّف رقم واتساب (أرقام التجربة تعمل فوراً)
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN  أي قيمة سرية تختارها للتحقق من الـ webhook
 */

const GRAPH_BASE = "https://graph.facebook.com";

export function getWhatsAppVersion(): string {
  return process.env.WHATSAPP_API_VERSION || "v21.0";
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * تحويل رقم KSA إلى الصيغة الدولية التي يتوقعها Graph API
 * 05xxxxxxxx → 9665xxxxxxxx | +966 5x → 9665x
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("966")) return digits;
  if (digits.startsWith("05")) return `966${digits.slice(1)}`;
  if (digits.startsWith("5")) return `966${digits}`;
  return digits;
}

/** إرسال فعلي عبر Graph API — يعيد wamid أو يرمي خطأ */
export async function sendWhatsAppText(to: string, body: string): Promise<string> {
  const version = getWhatsAppVersion();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const res = await fetch(`${GRAPH_BASE}/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizePhone(to),
      type: "text",
      text: { preview_url: false, body },
    }),
  });
  const data = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
  if (!res.ok || !data.messages?.[0]?.id) {
    throw new Error(`واتساب رفض الإرسال: ${data.error?.message ?? res.status}`);
  }
  return data.messages[0].id;
}

/**
 * الإخطار الموحد — تُستدعى من كل Server Actions.
 * مقاومة للفشل: خطأ الإرسال الفعلي لا يُفشل العملية، بل يُسجل في MessageLog
 */
export async function notifyWhatsApp(params: {
  tenantId: string;
  appointmentId: string | null;
  to: string;
  body: string;
  templateName?: string;
}) {
  const { tenantId, appointmentId, to, body, templateName = "text" } = params;

  if (!isWhatsAppConfigured()) {
    await logSimulated(tenantId, appointmentId, to, body, templateName);
    return;
  }

  try {
    const wamid = await sendWhatsAppText(to, body);
    await db.messageLog.create({
      data: {
        tenantId,
        appointmentId,
        direction: "out",
        waMessageId: wamid,
        templateName,
        payload: JSON.stringify({ to, body }),
        status: "sent",
      },
    });
  } catch (e) {
    // لا نُفشل عملية الحجز بسبب واتساب — نسجّل الفشل فقط
    await db.messageLog.create({
      data: {
        tenantId,
        appointmentId,
        direction: "out",
        waMessageId: null,
        templateName,
        payload: JSON.stringify({ to, body, error: e instanceof Error ? e.message : String(e) }),
        status: "failed",
      },
    });
  }
}

async function logSimulated(
  tenantId: string,
  appointmentId: string | null,
  to: string,
  body: string,
  templateName: string
) {
  await db.messageLog.create({
    data: {
      tenantId,
      appointmentId,
      direction: "out",
      waMessageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateName: `${templateName} (simulation)`,
      payload: JSON.stringify({ to, body }),
      status: "sent",
    },
  });
}
