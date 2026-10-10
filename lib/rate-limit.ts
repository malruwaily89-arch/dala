// حماية بسيطة من هجمات القوة العمياء (Brute Force) على تسجيل الدخول والتسجيل.
// تخزين في الذاكرة (in-memory) — كافٍ لخادم واحد (VPS)؛ لو انتقلنا لعدة نسخ من التطبيق
// يلزم استبدالها بمخزن مشترك (Redis) لأن كل نسخة تحتفظ بعداد منفصل.
import { headers } from "next/headers";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// تنظيف دوري للمفاتيح المنتهية لمنع تسرّب الذاكرة
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/** يرجع true إن كان مسموحاً بالمتابعة، و false إن تجاوز الحد */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** عنوان IP الحقيقي للعميل خلف Caddy (reverse proxy يضيف X-Forwarded-For) */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
