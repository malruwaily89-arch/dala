import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { getWhatsAppVersion } from "@/lib/whatsapp";

/**
 * Webhook من Meta:
 *  GET  — تحقق الاشتراك (hub.verify_token و hub.challenge)
 *  POST — الرسائل الواردة (direction=in) + تحديث حالات التسليم على MessageLog
 *
 * إعداد الـ URL في Meta App Dashboard:
 *   Callback URL: https://<نطاقك>/api/whatsapp/webhook
 *   Verify token: نفس WHATSAPP_WEBHOOK_VERIFY_TOKEN في .env
 *
 * أمان: كل POST يُتحقق من توقيعه عبر هيدر X-Hub-Signature-256 (HMAC-SHA256
 * على الجسم الخام باستخدام App Secret) — بدونه أي طرف يقدر يزوّر رسائل واردة
 * أو حالات تسليم. راجع WHATSAPP_APP_SECRET في .env (App Dashboard → Settings → Basic).
 */

// GET — تحقق اشتراك Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

interface GraphWebhookPayload {
  entry?: {
    changes?: {
      field?: string;
      value?: {
        contacts?: { profile?: { name?: string }; wa_id: string }[];
        messages?: { from: string; id: string; type: string; text?: { body?: string } }[];
        statuses?: { id: string; status: string }[];
      };
    }[];
  }[];
}

/** يتحقق من توقيع Meta على الجسم الخام. يرفض الطلب إن كان WHATSAPP_APP_SECRET مُعرّفاً والتوقيع غير مطابق. */
function isValidMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  // لو ما تم تجهيز App Secret بعد (وضع تجربة أولي)، نسمح بالمرور مع تسجيل تحذير
  // بدل كسر الويبهوك — لكن يجب تفعيله قبل الإطلاق الفعلي.
  if (!appSecret) {
    console.warn("[whatsapp webhook] WHATSAPP_APP_SECRET غير مُعرّف — التحقق من التوقيع معطّل");
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

// POST — الرسائل الواردة وحالات التسليم
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    console.warn("[whatsapp webhook] توقيع غير صالح — تم رفض الطلب");
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let payload: GraphWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GraphWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;

      // حالات التسليم (sent → delivered → read)
      for (const status of value.statuses ?? []) {
        const existing = await db.messageLog.findFirst({ where: { waMessageId: status.id } });
        if (existing) {
          await db.messageLog.update({
            where: { id: existing.id },
            data: { status: status.status },
          });
        }
      }

      // رسائل واردة من العميلات
      for (const msg of value.messages ?? []) {
        // مطابقة الصالون: الأرقام تأتي بصيغة دولية (9665xxxxxxxx) — نطابق آخر 9 خانات
        const tail = msg.from.slice(-9);
        const customer = await db.customer.findFirst({
          where: { phone: { contains: tail } },
        });
        await db.messageLog.create({
          data: {
            tenantId: customer?.tenantId ?? (process.env.WHATSAPP_FALLBACK_TENANT_ID || "unknown"),
            direction: "in",
            waMessageId: msg.id,
            templateName: "incoming",
            payload: JSON.stringify({
              from: msg.from,
              name: value.contacts?.[0]?.profile?.name ?? null,
              type: msg.type,
              body: msg.text?.body ?? null,
              graph_version: getWhatsAppVersion(),
            }),
            status: "received",
          },
        });
      }
    }
  }

  // Meta تتوقع 200 دائماً حتى عند أخطاء داخية (وإلا تعيد الإرسال)
  return NextResponse.json({ ok: true }, { status: 200 });
}
