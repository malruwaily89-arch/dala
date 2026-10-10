import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";
import { appUrl, bookingUrl } from "./env";
import { displayPhone } from "./phone";

/**
 * واتساب — Meta WhatsApp Cloud API (Graph).
 *  - الإرسال الفعلي يتطلب WHATSAPP_ACCESS_TOKEN + phoneNumberId الخاص بالصالون.
 *  - بدونهما تُسجَّل الرسالة بحالة "simulated" (لا تُرسل) — لا يفشل أي حجز بسبب واتساب.
 *  - كل رسالة تُسجَّل في MessageLog للمتابعة.
 */

const GRAPH = "https://graph.facebook.com";

export function whatsappApiVersion(): string {
  return process.env.WHATSAPP_API_VERSION || "v21.0";
}

export function isWhatsAppLive(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
}

export interface SendParams {
  salonId: string;
  appointmentId?: string | null;
  toPhone: string; // 9665XXXXXXXX
  body: string;
}

export async function sendWhatsAppText(params: SendParams): Promise<void> {
  const salon = await db.salon.findUnique({
    where: { id: params.salonId },
    select: { whatsappPhoneNumberId: true, slug: true, logo: { select: { mime: true } } },
  });
  const base = {
    salonId: params.salonId,
    appointmentId: params.appointmentId ?? null,
    direction: "out",
    toPhone: params.toPhone,
    body: params.body,
  };

  if (!isWhatsAppLive() || !salon?.whatsappPhoneNumberId) {
    await db.messageLog.create({ data: { ...base, status: "simulated" } });
    return;
  }

  try {
    const res = await fetch(`${GRAPH}/${whatsappApiVersion()}/${salon.whatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.toPhone,
        ...logoMessage(salon, params.body),
      }),
    });
    const data = (await res.json()) as { messages?: { id: string }[]; error?: { message?: string } };
    const wamid = data.messages?.[0]?.id;
    if (!res.ok || !wamid) {
      throw new Error(data.error?.message ?? `HTTP ${res.status}`);
    }
    await db.messageLog.create({ data: { ...base, status: "sent", waMessageId: wamid } });
  } catch (e) {
    await db.messageLog.create({
      data: { ...base, status: "failed", error: e instanceof Error ? e.message : String(e) },
    });
  }
}

/**
 * الرسالة تحمل شعار الصالون كصورة مع النص كتعليق عليها، ليتعرف عليه العميلة.
 * Meta تحتاج رابطاً عاماً بـ https، فإن لم يكن الموقع على https نرسل نصاً فقط.
 */
function logoMessage(salon: { slug: string; logo: { mime: string } | null } | null, body: string) {
  const base = appUrl();
  if (salon?.logo && base.startsWith("https://")) {
    return { type: "image", image: { link: `${base}/api/salon-logo/${salon.slug}`, caption: body } };
  }
  return { type: "text", text: { preview_url: false, body } };
}

/** التحقق من توقيع Meta (X-Hub-Signature-256) على جسم الطلب الخام */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = header.slice("sha256=".length);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/** تحويل الأرقام العربية-الهندية إلى لاتينية قبل تحليل الرد */
export function normalizeDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/**
 * منطق الرد الآلي على الرسائل الواردة:
 *   1 → رابط الحجز        2 → الاستفسار (تواصل مباشر)        غير ذلك → القائمة
 * دالة نقية لتسهيل الاختبار.
 */
export function buildInboundReply(input: {
  salonName: string;
  slug: string;
  contactPhone: string | null;
  text: string;
}): string {
  const choice = normalizeDigits(input.text).trim();
  const greeting = `أهلاً بك في ${input.salonName} 🌸\nاختاري رقم الخدمة:\n1 — حجز موعد\n2 — استفسار`;
  if (choice === "1") {
    return `احجزي موعدك بسهولة عبر الرابط:\n${bookingUrl(input.slug)}\nيُثبَّت الموعد بعد دفع العربون.`;
  }
  if (choice === "2") {
    const contact = input.contactPhone ? `على الرقم ${displayPhone(input.contactPhone)}` : "عبر هذه المحادثة";
    return `يسعدنا استفسارك! تواصلي معنا ${contact}، وسنرد عليك في أقرب وقت.`;
  }
  return greeting;
}
