# سيدة — نظام إدارة مواعيد الصالونات

Micro-SaaS لإدارة حجوزات الصالونات النسائية: صفحة حجز عامة لكل صالون،
عربون إلكتروني يمنع الغائبات، منع تعارض المواعيد، وقائمة انتظار ذكية.

## الحزمة التقنية

- **Next.js 16** (App Router) + React 19
- **Prisma 6** + SQLite (جاهز للترقية إلى PostgreSQL/Supabase بتغيير سطر واحد)
- **Tailwind CSS 4** — واجهة عربية RTL كاملة

## التشغيل

```bash
npm install
npx prisma migrate dev     # إنشاء قاعدة البيانات
npx next dev               # التطوير
npx next build && npx next start   # الإنتاج
```

انسخ `.env.example` إلى `.env` وعدّل `DATABASE_URL` عند الحاجة.

## حساب تجريبي جاهز

| | |
|---|---|
| الصالون | صالون ريّان — `/b/demo-salon` |
| البريد | `owner@demo.sa` |
| كلمة المرور | `123456` |

## البنية

```
app/
  page.tsx                  الصفحة التعريفية
  login/                    تسجيل الدخول
  dashboard/                لوحة التحكم (يومك، المواعيد، العميلات، الخدمات، الموظفات)
  b/[slug]/                 صفحة الحجز العامة لكل صالون
  b/[slug]/pay/[code]/      صفحة دفع العربون
  actions/                  Server Actions (مصادقة + مواعيد)
lib/
  db.ts                     Prisma Client (singleton)
  auth.ts                   جلسات + تشفير scrypt
  scheduling.ts             حساب المواعيد المتاحة ومنع التعارض
  utils.ts                  أرقام الحجز + تنسيق التواريخ العربية
prisma/schema.prisma        9 جداول (متعدد المستأجرين من اليوم الأول)
```

## خريطة الطريق القادمة

1. **واتساب حقيقي**: ربط Meta WhatsApp Cloud API (دورة التأكيد والتذكير موجودة كمحاكاة في `MessageLog`)
2. **بوابة دفع حقيقية**: Moyasar أو Tap — بنية `paymentRef` جاهزة للمطابقة التلقائية عبر Webhook
3. **تطبيق جوال**: Expo (React Native) فوق نفس الـ API — Android وiOS
4. **الإنتاج**: PostgreSQL + خوادم داخل السعودية لامتثال نظام حماية البيانات الشخصية (PDPL)
