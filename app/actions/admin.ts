"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";

const PLAN_PRICES: Record<string, number> = {
  BASIC: 300,
  PRO: 600,
  ADVANCED: 1200,
  BASIC_PRO: 299,
  PRO_PRO: 599,
  ADVANCED_PRO: 1299,
};

const PLATFORM_SLUGS = ["dalal-platform"];
const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export async function getAdminStats() {
  await requireSuperAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const tenantCount = await db.tenant.count({
    where: { slug: { notIn: PLATFORM_SLUGS } },
  });
  const activeSubscriptions = await db.subscription.count({
    where: { status: "active", tenant: { slug: { notIn: PLATFORM_SLUGS } } },
  });

  const activeSubs = await db.subscription.findMany({
    where: { status: "active", tenant: { slug: { notIn: PLATFORM_SLUGS } } },
    select: { plan: true },
  });
  const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);

  const monthlyPayments = await db.payment.aggregate({
    _sum: { amount: true },
    where: {
      status: "paid",
      paidAt: { gte: monthStart, lte: monthEnd },
      tenant: { slug: { notIn: PLATFORM_SLUGS } },
    },
  });

  return {
    tenantCount,
    activeSubscriptions,
    mrr,
    monthlyPayments: monthlyPayments._sum.amount ?? 0,
  };
}

export async function getTenantsTable() {
  await requireSuperAdmin();

  const tenants = await db.tenant.findMany({
    where: { slug: { notIn: PLATFORM_SLUGS } },
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return tenants.map((t) => {
    const sub = t.subscriptions[0];
    const payment = t.payments[0];
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: sub?.plan ?? "—",
      status: sub?.status ?? "—",
      lastPayment: payment
        ? { amount: payment.amount, status: payment.status, paidAt: payment.paidAt }
        : null,
    };
  });
}

export async function getRecentPayments() {
  await requireSuperAdmin();

  const payments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { tenant: { select: { name: true, slug: true } } },
  });

  return payments.map((p) => ({
    id: p.id,
    tenantName: p.tenant.name,
    tenantSlug: p.tenant.slug,
    amount: p.amount,
    status: p.status,
    provider: p.provider,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  }));
}

/** نمو الاشتراكات و MRR لآخر 6 أشهر (تقريب من تواريخ الإنشاء/الإلغاء) */
export async function getGrowthHistory() {
  await requireSuperAdmin();

  const tenants = await db.tenant.findMany({
    where: { slug: { notIn: PLATFORM_SLUGS } },
    select: { createdAt: true },
  });
  const subs = await db.subscription.findMany({
    where: { tenant: { slug: { notIn: PLATFORM_SLUGS } } },
    select: { plan: true, startedAt: true, canceledAt: true, status: true },
  });

  const now = new Date();
  const months: { label: string; tenantCount: number; mrr: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const tenantCount = tenants.filter((t) => t.createdAt <= monthEnd).length;
    const mrr = subs.reduce((sum, s) => {
      const started = s.startedAt <= monthEnd;
      const stillRunning = s.status !== "canceled" || (s.canceledAt && s.canceledAt > monthEnd);
      return started && stillRunning ? sum + (PLAN_PRICES[s.plan] ?? 0) : sum;
    }, 0);
    months.push({
      label: monthEnd.toLocaleDateString("ar-SA", { month: "short" }),
      tenantCount,
      mrr,
    });
  }

  return months;
}

/** توزيع الصالونات على الباقات (حسب أحدث اشتراك لكل صالون) */
export async function getPlanDistribution() {
  await requireSuperAdmin();

  const tenants = await db.tenant.findMany({
    where: { slug: { notIn: PLATFORM_SLUGS } },
    include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const counts: Record<string, number> = {
    BASIC: 0,
    PRO: 0,
    ADVANCED: 0,
    BASIC_PRO: 0,
    PRO_PRO: 0,
    ADVANCED_PRO: 0,
  };
  for (const t of tenants) {
    const plan = t.subscriptions[0]?.plan;
    if (plan && plan in counts) counts[plan] += 1;
  }
  return counts;
}

/** الصالونات التي ألغت اشتراكها + معدل الاضطراب الشهري */
export async function getChurnData() {
  await requireSuperAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const canceled = await db.subscription.findMany({
    where: { status: "canceled", tenant: { slug: { notIn: PLATFORM_SLUGS } } },
    orderBy: { canceledAt: "desc" },
    include: { tenant: { select: { name: true, slug: true } } },
  });

  const canceledThisMonth = canceled.filter(
    (s) => s.canceledAt && s.canceledAt >= monthStart
  ).length;

  const activeAtMonthStart = await db.subscription.count({
    where: {
      tenant: { slug: { notIn: PLATFORM_SLUGS } },
      startedAt: { lt: monthStart },
      status: { in: ["active", "past_due", "trialing", "suspended"] },
    },
  });

  const churnRate = activeAtMonthStart > 0 ? (canceledThisMonth / activeAtMonthStart) * 100 : 0;

  return {
    canceled: canceled.map((s) => ({
      id: s.id,
      tenantName: s.tenant.name,
      tenantSlug: s.tenant.slug,
      plan: s.plan,
      canceledAt: s.canceledAt,
    })),
    canceledThisMonth,
    activeAtMonthStart,
    churnRate,
  };
}

/** الصالونات المتأخرة في الدفع */
export async function getOverdueTenants() {
  await requireSuperAdmin();

  const overdue = await db.subscription.findMany({
    where: { status: "past_due", tenant: { slug: { notIn: PLATFORM_SLUGS } } },
    orderBy: { currentPeriodEnd: "asc" },
    include: { tenant: { select: { name: true, slug: true, phone: true } } },
  });

  return overdue.map((s) => ({
    id: s.id,
    tenantName: s.tenant.name,
    tenantSlug: s.tenant.slug,
    tenantPhone: s.tenant.phone,
    plan: s.plan,
    currentPeriodEnd: s.currentPeriodEnd,
  }));
}

/** ملخص رسائل واتساب المرسلة */
export async function getMessageStats() {
  await requireSuperAdmin();

  const total = await db.messageLog.count();
  const delivered = await db.messageLog.count({ where: { status: "delivered" } });
  const failed = await db.messageLog.count({ where: { status: "failed" } });
  const sent = await db.messageLog.count({ where: { status: "sent" } });
  const queued = await db.messageLog.count({ where: { status: "queued" } });

  const recent = await db.messageLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 15,
    include: { tenant: { select: { name: true } } },
  });

  return {
    total,
    delivered,
    failed,
    sent,
    queued,
    recent: recent.map((m) => ({
      id: m.id,
      tenantName: m.tenant.name,
      status: m.status,
      templateName: m.templateName,
      direction: m.direction,
      sentAt: m.sentAt,
    })),
  };
}

/** جدول الصالونات الكامل لصفحة الإدارة اليدوية */
export async function getSalonsForManagement() {
  await requireSuperAdmin();

  const tenants = await db.tenant.findMany({
    where: { slug: { notIn: PLATFORM_SLUGS } },
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      users: { where: { role: "OWNER" }, take: 1, select: { email: true } },
    },
  });

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    phone: t.phone,
    ownerEmail: t.users[0]?.email ?? "—",
    subscriptionId: t.subscriptions[0]?.id ?? null,
    plan: t.subscriptions[0]?.plan ?? "—",
    status: t.subscriptions[0]?.status ?? "—",
    currentPeriodEnd: t.subscriptions[0]?.currentPeriodEnd ?? null,
  }));
}

/** إنشاء صالون جديد يدوياً: Tenant + مالكة + اشتراك */
export async function createSalonAction(formData: FormData) {
  await requireSuperAdmin();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const plan = String(formData.get("plan") || "BASIC");

  if (!name || !phone || !email || !password || !SLUG_RE.test(slug)) {
    redirect("/admin/salons?error=1");
  }
  if (!(plan in PLAN_PRICES)) {
    redirect("/admin/salons?error=1");
  }

  const existingSlug = await db.tenant.findUnique({ where: { slug } });
  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingSlug || existingEmail) {
    redirect("/admin/salons?error=exists");
  }

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  await db.tenant.create({
    data: {
      name,
      slug,
      phone,
      plan: plan.toLowerCase(),
      users: {
        create: {
          email,
          passwordHash: hashPassword(password),
          name: `مالكة ${name}`,
          role: "OWNER",
        },
      },
      subscriptions: {
        create: {
          plan,
          status: "active",
          currentPeriodEnd: periodEnd,
        },
      },
    },
  });

  revalidatePath("/admin/salons");
  revalidatePath("/admin");
  redirect("/admin/salons?ok=1");
}

/** تعديل باقة الصالون (ترقية/تخفيض) */
export async function updateSalonPlanAction(formData: FormData) {
  await requireSuperAdmin();

  const subscriptionId = String(formData.get("subscriptionId") || "");
  const plan = String(formData.get("plan") || "");
  if (!subscriptionId || !(plan in PLAN_PRICES)) redirect("/admin/salons?error=1");

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { plan },
  });

  revalidatePath("/admin/salons");
  revalidatePath("/admin");
  redirect("/admin/salons?ok=1");
}

/** تغيير حالة اشتراك الصالون: تعليق مؤقت / إلغاء / إعادة تنشيط */
export async function updateSalonStatusAction(formData: FormData) {
  await requireSuperAdmin();

  const subscriptionId = String(formData.get("subscriptionId") || "");
  const status = String(formData.get("status") || "");
  const allowed = ["active", "suspended", "canceled"];
  if (!subscriptionId || !allowed.includes(status)) redirect("/admin/salons?error=1");

  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status,
      canceledAt: status === "canceled" ? new Date() : null,
    },
  });

  revalidatePath("/admin/salons");
  revalidatePath("/admin");
  revalidatePath("/admin/churn");
  revalidatePath("/admin/overdue");
  redirect("/admin/salons?ok=1");
}

/** تسجيل دفعة يدوية للصالون */
export async function recordManualPaymentAction(formData: FormData) {
  await requireSuperAdmin();

  const tenantId = String(formData.get("tenantId") || "");
  const subscriptionId = String(formData.get("subscriptionId") || "") || null;
  const amount = Number(formData.get("amount") || 0);

  if (!tenantId || !amount || amount <= 0) redirect("/admin/salons?error=1");

  await db.payment.create({
    data: {
      tenantId,
      subscriptionId,
      amount,
      status: "paid",
      provider: "manual",
      paidAt: new Date(),
    },
  });

  revalidatePath("/admin/salons");
  revalidatePath("/admin");
  redirect("/admin/salons?ok=1");
}
