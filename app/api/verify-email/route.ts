import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/verify-email?token=... — يفعّل بريد المستخدم عند صحة الرمز وعدم انتهائه */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  // request.nextUrl.origin يعطي عنوان الحاوية الداخلي (0.0.0.0:3211) خلف Caddy، لذا نستخدم الدومين الثابت
  const baseUrl = process.env.APP_BASE_URL || "https://d-alal.com";

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?verify=missing`);
  }

  const user = await db.user.findUnique({ where: { verifyToken: token } });

  if (!user || !user.verifyTokenExpiresAt || user.verifyTokenExpiresAt < new Date()) {
    return NextResponse.redirect(`${baseUrl}/login?verify=invalid`);
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), verifyToken: null, verifyTokenExpiresAt: null },
  });

  return NextResponse.redirect(`${baseUrl}/login?verify=success`);
}
