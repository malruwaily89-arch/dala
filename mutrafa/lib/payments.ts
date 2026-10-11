import { randomBytes } from "crypto";
import { db } from "./db";
import { appUrl, paymentMode, sandboxPaymentsAllowed } from "./env";
import { audit } from "./audit";
import { PLANS, ADDONS, type AddonKindCode, type PlanCode } from "./plans";
import { addDays } from "./time";
import { confirmAppointmentAfterDeposit } from "./booking";

/**
 * طبقة الدفع:
 *  - sandbox  : صفحة دفع تجريبية داخل الموقع (لا تُحصّل أي مبلغ). تُستخدم للتجربة الكاملة للتدفق.
 *  - moyasar  : إنشاء فاتورة حقيقية عبر Moyasar API، ويصل التأكيد عبر webhook.
 *
 * كل تأكيد دفع (من الصفحة التجريبية أو من webhook) يمر عبر markPaymentPaid() وهي idempotent.
 */

export interface CheckoutResult {
  providerRef: string;
  url: string;
}

export async function createCheckout(params: {
  amountHalalas: number;
  description: string;
  successPath: string;
  paymentId: string;
}): Promise<CheckoutResult> {
  if (paymentMode() === "moyasar") {
    return createMoyasarInvoice(params);
  }
  if (!sandboxPaymentsAllowed()) {
    throw new Error("وضع الدفع التجريبي معطّل في الإنتاج. فعّلي بوابة Moyasar.");
  }
  const providerRef = `sbx_${randomBytes(12).toString("hex")}`;
  return { providerRef, url: `${appUrl()}/sandbox/pay/${providerRef}` };
}

async function createMoyasarInvoice(params: {
  amountHalalas: number;
  description: string;
  successPath: string;
  paymentId: string;
}): Promise<CheckoutResult> {
  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) throw new Error("مفتاح Moyasar غير مضبوط");
  const res = await fetch("https://api.moyasar.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountHalalas,
      currency: "SAR",
      description: params.description,
      success_url: `${appUrl()}${params.successPath}`,
      back_url: `${appUrl()}${params.successPath}`,
      metadata: { paymentId: params.paymentId },
    }),
  });
  const data = (await res.json()) as { id?: string; url?: string; message?: string };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(`Moyasar رفض إنشاء الفاتورة: ${data.message ?? res.status}`);
  }
  return { providerRef: data.id, url: data.url };
}

/** التحقق من webhook — يُقارن بقيمة سرية تُضبط في لوحة Moyasar */
export function verifyMoyasarWebhookToken(provided: string | null | undefined): boolean {
  const expected = process.env.MOYASAR_WEBHOOK_SECRET;
  if (!expected || !provided || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

/**
 * يسجّل دفعة كمدفوعة ويطبّق أثرها (تأكيد الحجز أو تفعيل الاشتراك).
 * idempotent: إعادة الاستدعاء لنفس الدفعة لا تكرر أي أثر.
 */
export async function markPaymentPaid(providerRef: string, method: string | null): Promise<boolean> {
  const payment = await db.payment.findUnique({ where: { providerRef } });
  if (!payment || payment.status === "PAID") return false;

  await db.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date(), method },
  });

  if (payment.kind === "DEPOSIT" && payment.appointmentId) {
    await confirmAppointmentAfterDeposit(payment.appointmentId);
  }
  if (payment.kind === "SUBSCRIPTION" && payment.subscriptionId) {
    await applySubscriptionPayment(payment.subscriptionId, payment.salonId);
  }
  if (payment.kind === "ADDON" && payment.addonId) {
    await db.addonPurchase.update({ where: { id: payment.addonId }, data: { active: true } });
    await audit({ salonId: payment.salonId, action: "addon.activated", entityType: "addon", entityId: payment.addonId });
  }
  return true;
}

/** تفعيل الباقة/الإضافات بعد الدفع */
async function applySubscriptionPayment(subscriptionId: string, salonId: string): Promise<void> {
  const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  const now = new Date();
  const periodStart = sub.status === "ACTIVE" && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      plan: sub.pendingPlan ?? sub.plan,
      pendingPlan: null,
      currentPeriodStart: periodStart,
      currentPeriodEnd: addDays(periodStart, 30),
      canceledAt: null,
    },
  });
  await audit({ salonId, action: "subscription.activated", entityType: "subscription", entityId: subscriptionId });
}

/** إنشاء دفعة اشتراك لباقة (أو لتغييرها) */
export async function startPlanPurchase(params: {
  salonId: string;
  userId: string;
  plan: PlanCode;
}): Promise<CheckoutResult> {
  const sub = await db.subscription.findUniqueOrThrow({ where: { salonId: params.salonId } });
  const amountHalalas = PLANS[params.plan].priceSar * 100;
  const payment = await db.payment.create({
    data: {
      salonId: params.salonId,
      kind: "SUBSCRIPTION",
      status: "PENDING",
      amountHalalas,
      subscriptionId: sub.id,
      providerRef: `pending_${randomBytes(10).toString("hex")}`,
      provider: paymentMode(),
    },
  });
  const checkout = await createCheckout({
    amountHalalas,
    description: `مُترَفة — باقة ${PLANS[params.plan].nameAr}`,
    successPath: "/dashboard/billing?ok=paid",
    paymentId: payment.id,
  });
  await db.$transaction([
    db.payment.update({ where: { id: payment.id }, data: { providerRef: checkout.providerRef } }),
    db.subscription.update({ where: { id: sub.id }, data: { pendingPlan: params.plan } }),
  ]);
  await audit({
    salonId: params.salonId,
    userId: params.userId,
    action: "subscription.plan_selected",
    entityType: "subscription",
    entityId: sub.id,
    meta: { plan: params.plan },
  });
  return checkout;
}

/** شراء إضافة شهرية */
export async function startAddonPurchase(params: {
  salonId: string;
  userId: string;
  kind: AddonKindCode;
  quantity: number;
}): Promise<CheckoutResult> {
  const sub = await db.subscription.findUniqueOrThrow({ where: { salonId: params.salonId } });
  const def = ADDONS[params.kind];
  const amountHalalas = def.priceSar * 100 * params.quantity;
  const addon = await db.addonPurchase.create({
    data: { salonId: params.salonId, subscriptionId: sub.id, kind: params.kind, quantity: params.quantity, active: false },
  });
  const payment = await db.payment.create({
    data: {
      salonId: params.salonId,
      kind: "ADDON",
      amountHalalas,
      subscriptionId: sub.id,
      addonId: addon.id,
      providerRef: `pending_${randomBytes(10).toString("hex")}`,
      provider: paymentMode(),
    },
  });
  const checkout = await createCheckout({
    amountHalalas,
    description: `مُترَفة — ${def.nameAr} × ${params.quantity}`,
    successPath: "/dashboard/billing?ok=paid",
    paymentId: payment.id,
  });
  await db.payment.update({ where: { id: payment.id }, data: { providerRef: checkout.providerRef } });
  await audit({
    salonId: params.salonId,
    userId: params.userId,
    action: "addon.purchase_started",
    entityType: "addon",
    entityId: addon.id,
    meta: { kind: params.kind, quantity: params.quantity },
  });
  return checkout;
}

