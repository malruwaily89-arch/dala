import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إخراج مستقل (standalone) — يجعل النشر عبر Docker/Vercel محتوياً ذاتياً
  // مع تتبّع ملفات تلقائي يشمل عميل Prisma المولّد.
  output: "standalone",
};

export default nextConfig;
