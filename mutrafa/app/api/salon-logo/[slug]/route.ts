import { db } from "@/lib/db";

/** شعار الصالون: يُعرض في صفحة الحجز ويُرسل كصورة في رسائل واتساب */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const logo = await db.salonLogo.findFirst({ where: { salon: { slug } }, select: { mime: true, data: true } });
  if (!logo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": logo.mime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
