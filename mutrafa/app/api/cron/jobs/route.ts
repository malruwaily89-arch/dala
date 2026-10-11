import { NextRequest, NextResponse } from "next/server";
import { runScheduledJobs } from "@/lib/jobs";

/** يُستدعى من مجدول خارجي كل 15 دقيقة: Authorization: Bearer <CRON_SECRET> */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runScheduledJobs();
  return NextResponse.json({ ok: true, ...result });
}
