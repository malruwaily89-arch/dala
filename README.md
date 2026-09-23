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

1. **بوابة دفع حقيقية**: Moyasar أو Tap — بنية `paymentRef` جاهزة للمطابقة التلقائية عبر Webhook
2. **تطبيق جوال**: Expo (React Native) فوق نفس الـ API — Android وiOS
3. **الإنتاج**: PostgreSQL + خوادم داخل السعودية لامتثال نظام حماية البيانات الشخصية (PDPL)

## ربط واتساب الحقيقي للتجربة (Meta WhatsApp Cloud API)

النظام يرسل فعلياً عند توفر مفتاحين، ويبقى في وضع المحاكاة (بدون رسائل واتساب) بدونهما — بدون أي تعديل كود.

### الخطوات (10 دقائق)

1. **أنشئي تطبيق Meta**:
   - `<https://developers.facebook.com/apps>` → Create App → نوع Business
   - أضيفي منتج **WhatsApp** من لوحة التطبيق

2. **احصلي على بيانات رقم التجربة** (WhatsApp → API Setup):
   - `Temporary access token` → ضعيه في `WHATSAPP_ACCESS_TOKEN` بـ `.env`
   - `Test phone number ID` → ضعيه في `WHATSAPP_PHONE_NUMBER_ID`
   - **أضيفي جوالك كمستلم مختبَر** (To) من نفس الصفحة — لا يمكن إرسال إلا لأرقام مسجلة

3. **اشتري الـ webhook** (WhatsApp → Configuration):
   - Callback URL: `<https://<نطاقك>/api/whatsapp/webhook>` (للتجربة المحلية: `ngrok http 3210`)
   - Verify token: نفس قيمة `WHATSAPP_WEBHOOK_VERIFY_TOKEN` في `.env`
   - اشتري حقل **messages**

4. **أعيدي التشغيل**: `npx next dev` — كل تأكيدات الحجوزات تصل الآن فعلياً على واتساب.

### اختبار الارتباط بدون واجهة

```bash
# 1) تحقق الاشتراك (يجب أن يعيد challenge)
curl "http://localhost:3210/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=sayyida-test-verify-token&hub.challenge=hello"

# 2) إرسال فعلي لجوالك المسجل (بعد وضع المفتاحين)
curl -X POST "https://graph.facebook.com/v21.0/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"<جوالك>","type":"text","text":{"body":"سلام من سيدة!"}}'
```

### أين تُراقب الرسائل؟

جدول `message_logs` يحفظ كل شيء: wamid الحقيقي، الحالة (sent → delivered → read)،
والرسائل الواردة من العميلات — مع سجل فشل مقاوم للانقطاع (خطأ واتساب لا يُفشل الحجز).
