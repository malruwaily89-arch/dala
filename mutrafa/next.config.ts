import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إخراج مستقل لنشر Docker/Netlify/Vercel
  output: "standalone",
  poweredByHeader: false,
  // المشروع داخل مستودع أكبر (دلال) — نحدد الجذر صراحةً لتفادي اختيار lockfile الخطأ
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
