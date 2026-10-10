# مساعد واتساب الشخصي

خدمة صغيرة تربط رقم واتساب (WhatsApp Cloud API) بـ Claude. ترد على رقم صاحبها فقط، وتحفظ أي ملف يُرسل لها داخل مجلد على السيرفر (`inbox/<التاريخ>/`).

يقدر المساعد: يعرض ملفات المجلد، يقرأ النصوص وPDF والصور، يحفظ ملاحظات نصية، يرسل ملفاً من المجلد على الواتساب، ويبحث في الإنترنت. لا يقدر يكتب أو يقرأ خارج المجلد.

## التشغيل على السيرفر

```bash
cd ~/dala && git pull
cd assistant
cp .env.example .env && nano .env          # عبّئ القيم
mkdir -p state ~/assistant-files
docker compose up -d --build
```

أضف للـ Caddyfile (بعد ربط `agent.d-alal.com` بـ IP السيرفر في DNS):

```
agent.d-alal.com {
	reverse_proxy assistant:3300
}
```

ثم في Meta (تطبيق رقم المساعد ← WhatsApp ← Configuration): Callback URL هو `https://agent.d-alal.com/webhook`، و Verify token نفس قيمة `WHATSAPP_VERIFY_TOKEN`، واشترك في حقل `messages`.

## شخصية المساعد

اكتب تعليماتك في `state/prompt.md` ثم `docker compose restart`. تغيير التعليمات يبدأ محادثة جديدة تلقائياً، والقديمة تُحفظ في `state/`.

أرسل `/جديد` في الواتساب لبدء محادثة جديدة في أي وقت.

## التطوير

```bash
npm install
npm test
```
