import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildInboundReply, sendWhatsAppText, verifyMetaSignature } from "@/lib/whatsapp";
import { normalizeSaPhone } from "@/lib/phone";

/**
 * Webhook واتساب (Meta Cloud API)
 *  GET  — تحقق الاشتراك (hub.verify_token)
 *  POST — رسائل واردة (ترد تلقائياً بالقائمة/رابط الحجز) + حالات التسليم
 * كل رسالة تُوجَّه للصالون عبر metadata.phone_number_id.
 */

interface MetaMessage {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
}

interface MetaPayload {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: MetaMessage[];
        statuses?: { id: string; status: string }[];
      };
    }[];
  }[];
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (p.get("hub.mode") === "subscribe" && verifyToken && p.get("hub.verify_token") === verifyToken) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    if (!verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // في الإنتاج لا نقبل رسائل غير موقّعة
    return NextResponse.json({ ok: false, error: "WHATSAPP_APP_SECRET غير مضبوط" }, { status: 503 });
  }

  let payload: MetaPayload;
  try {
    payload = JSON.parse(raw) as MetaPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;

      // حالات التسليم: sent → delivered → read
      for (const st of value.statuses ?? []) {
        await db.messageLog.updateMany({ where: { waMessageId: st.id }, data: { status: st.status } });
      }

      const phoneNumberId = value.metadata?.phone_number_id;
      const salon = phoneNumberId
        ? await db.salon.findUnique({ where: { whatsappPhoneNumberId: phoneNumberId } })
        : null;

      for (const msg of value.messages ?? []) {
        if (!salon) continue; // رقم غير مربوط بصالون — نتجاهله
        const from = normalizeSaPhone(msg.from) ?? msg.from;
        const text = msg.text?.body ?? "";
        const duplicate = await db.messageLog.findUnique({ where: { waMessageId: msg.id } });
        if (duplicate) continue; // Meta قد تعيد الإرسال

        await db.messageLog.create({
          data: {
            salonId: salon.id,
            direction: "in",
            fromPhone: from,
            body: text || `[${msg.type}]`,
            waMessageId: msg.id,
            status: "received",
          },
        });

        if (msg.type === "text") {
          const reply = buildInboundReply({
            salonName: salon.name,
            slug: salon.slug,
            contactPhone: salon.whatsappNumber,
            text,
          });
          await sendWhatsAppText({ salonId: salon.id, toPhone: from, body: reply });
        }
      }
    }
  }

  // Meta تعيد الإرسال عند أي استجابة غير 200 — نُرجع 200 دائماً بعد التحقق
  return NextResponse.json({ ok: true }, { status: 200 });
}
