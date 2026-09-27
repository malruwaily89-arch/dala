"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword, getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateVerifyToken, sendVerificationEmail } from "@/lib/email";

function generateSlug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const suffix = randomBytes(6).toString("hex");
  return `${base || "salon"}-${suffix}`;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?error=missing");

  const ip = await getClientIp();
  // حد لكل (IP + بريد) لمنع تخمين كلمة المرور لحساب معيّن، وحد أوسع لكل IP لمنع رشّ محاولات على حسابات متعددة
  const perAccountOk = checkRateLimit(`login:acct:${ip}:${email}`, 5, 15 * 60 * 1000);
  const perIpOk = checkRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000);
  if (!perAccountOk || !perIpOk) {
    redirect("/login?error=too_many");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }
  await createSession(user.id);
  redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "").trim();

  const ip = await getClientIp();
  if (!checkRateLimit(`signup:ip:${ip}`, 5, 60 * 60 * 1000)) {
    redirect("/signup?error=too_many");
  }

  if (!name || !email || !password || !phone || !city) {
    redirect("/signup?error=missing");
  }
  if (password.length < 6) {
    redirect("/signup?error=password");
  }

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    redirect("/signup?error=exists");
  }

  const now = new Date();
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const verifyToken = generateVerifyToken();
  const verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const tenant = await db.tenant.create({
    data: {
      name,
      slug: generateSlug(name),
      phone,
      city,
      plan: "basic",
      users: {
        create: {
          email,
          passwordHash: hashPassword(password),
          name: `مالكة ${name}`,
          role: "OWNER",
          verifyToken,
          verifyTokenExpiresAt,
        },
      },
      subscriptions: {
        create: {
          plan: "BASIC",
          status: "trialing",
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
        },
      },
    },
    include: { users: true },
  });

  const owner = tenant.users[0];

  try {
    await sendVerificationEmail(email, verifyToken);
  } catch (e) {
    // لا نفشل التسجيل بسبب خطأ إرسال البريد — الحساب يبقى شغّالاً وتقدر تطلب إعادة الإرسال لاحقاً
    console.log("[signup] فشل إرسال إيميل التفعيل:", e instanceof Error ? e.message : e);
  }

  await createSession(owner.id);
  redirect("/dashboard");
}

/** إعادة إرسال إيميل التفعيل للمستخدم الحالي (تُستدعى من بانر لوحة التحكم) */
export async function resendVerificationAction() {
  const user = await getCurrentUser();
  if (!user || user.emailVerifiedAt) redirect("/dashboard");

  const ip = await getClientIp();
  if (!checkRateLimit(`resend-verify:${user.id}`, 3, 15 * 60 * 1000)) {
    redirect("/dashboard?verify_error=too_many");
  }
  if (!checkRateLimit(`resend-verify:ip:${ip}`, 10, 15 * 60 * 1000)) {
    redirect("/dashboard?verify_error=too_many");
  }

  const verifyToken = generateVerifyToken();
  const verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.user.update({
    where: { id: user.id },
    data: { verifyToken, verifyTokenExpiresAt },
  });

  let failed = false;
  try {
    await sendVerificationEmail(user.email, verifyToken);
  } catch (e) {
    console.log("[resend-verify] فشل إرسال إيميل التفعيل:", e instanceof Error ? e.message : e);
    failed = true;
  }
  redirect(failed ? "/dashboard?verify_error=1" : "/dashboard?verify_sent=1");
}
