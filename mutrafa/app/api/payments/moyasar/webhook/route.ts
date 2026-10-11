import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markPaymentPaid, verifyMoyasarWebhookToken } from "@/lib/payments";

/**
 * Webhook من Moyasar (وضع moyasar فقط).
 * يُضبط في لوحة Moyasar على: https://<نطاقك>/api/payments/moyasar/webhook
 * ويُحمى بقيمة سرية MOYASAR_WEBHOOK_SECRET تُرسل مع الطلب (secret_token).
 * الدفعات مرتبطة بالفاتورة عبر providerRef = invoice id.
 */

interface MoyasarEvent {
  id?: string;
  type?: string;
  secret_token?: string;
  data?: {
    id?: string;
    status?: string;
    invoice_id?: string | null;
    source?: { type?: string };
  };
}

export async function POST(request: NextRequest) {
  let event: MoyasarEvent;
  try {
    event = (await request.json()) as MoyasarEvent;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!verifyMoyasarWebhookToken(event.secret_token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const data = event.data ?? {};
  const providerRef = data.invoice_id ?? data.id;
  if (!providerRef) return NextResponse.json({ ok: true }, { status: 200 });

  const method = data.source?.type ?? null;
  if (data.status === "paid" || event.type === "payment_paid" || event.type === "invoice_paid") {
    await markPaymentPaid(providerRef, method);
  } else if (data.status === "failed" || event.type === "payment_failed") {
    await db.payment.updateMany({ where: { providerRef, status: "PENDING" }, data: { status: "FAILED" } });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
