"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword, hashPassword } from "@/lib/auth";
import { loginSchema, signupSchema, firstIssue } from "@/lib/validation";
import { normalizeSaPhone } from "@/lib/phone";
import { trialEndsFrom } from "@/lib/subscription";
import { audit } from "@/lib/audit";
import { isPlanCode } from "@/lib/plans";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect(`/login?error=${encodeURIComponent(firstIssue(parsed.error))}`);

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid || !user.active) {
    redirect("/login?error=" + encodeURIComponent("البريد أو كلمة المرور غير صحيحة"));
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    salonName: formData.get("salonName"),
    slug: formData.get("slug"),
    whatsapp: formData.get("whatsapp"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
    plan: String(formData.get("plan") ?? "INDIE"),
    terms: formData.get("terms") ?? undefined,
  });
  if (!parsed.success) redirect(`/signup?error=${encodeURIComponent(firstIssue(parsed.error))}`);
  const d = parsed.data;
  if (!isPlanCode(d.plan)) redirect("/signup?error=" + encodeURIComponent("باقة غير معروفة"));

  const [slugTaken, emailTaken] = await Promise.all([
    db.salon.findUnique({ where: { slug: d.slug }, select: { id: true } }),
    db.user.findUnique({ where: { email: d.email }, select: { id: true } }),
  ]);
  if (slugTaken) redirect("/signup?error=" + encodeURIComponent("اسم الرابط مستخدم، اختاري اسماً آخر"));
  if (emailTaken) redirect("/signup?error=" + encodeURIComponent("هذا البريد مسجّل مسبقاً"));

  const now = new Date();
  const trialEnd = trialEndsFrom(now);
  const passwordHash = await hashPassword(d.password);
  const salon = await db.salon.create({
    data: {
      name: d.salonName,
      slug: d.slug,
      whatsappNumber: normalizeSaPhone(d.whatsapp)!,
      subscription: {
        create: {
          plan: d.plan,
          status: "TRIALING",
          trialEndsAt: trialEnd,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
        },
      },
      users: {
        create: { email: d.email, name: d.ownerName, passwordHash, role: "OWNER" },
      },
    },
    include: { users: true },
  });

  await audit({ salonId: salon.id, userId: salon.users[0].id, action: "salon.created", entityType: "salon", entityId: salon.id });
  await createSession(salon.users[0].id);
  redirect("/dashboard?welcome=1");
}
