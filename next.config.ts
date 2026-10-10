import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إخراج مستقل (standalone) — يجعل النشر عبر Docker/Vercel محتوياً ذاتياً
  // مع تتبّع ملفات تلقائي يشمل عميل Prisma المولّد.
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // يخفي هيدر X-Powered-By: Next.js (تقليل معلومات الاستطلاع للمهاجم)
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.moyasar.com https://graph.facebook.com https://vitals.vercel-insights.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
