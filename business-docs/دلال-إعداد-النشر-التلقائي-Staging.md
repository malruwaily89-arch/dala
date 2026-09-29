# إعداد النشر التلقائي إلى Staging

أُضيف Workflow باسم `Deploy Dala to Staging`. يعمل عند رفع commit إلى فرع `codex/dala-ai-team` أو عند تشغيله يدويًا من GitHub Actions. لا يملك أي خطوة للنشر إلى Production ولا يشغّل حذف بيانات أو Bootstrap تلقائيًا.

## إعداد GitHub مرة واحدة

أنشئ Environment باسم `staging` في إعدادات المستودع، ثم أضف Secrets التالية:

- `STAGING_SSH_HOST`: عنوان الخادم.
- `STAGING_SSH_USER`: اسم مستخدم SSH.
- `STAGING_SSH_KEY`: مفتاح SSH خاص مخصص للنشر إلى Staging فقط؛ لا يوضع في المستودع ولا يُرسل في المحادثة.
- `STAGING_KNOWN_HOSTS`: مخرجات `ssh-keyscan -H <host>` بعد التحقق من البصمة خارج GitHub.

وأضف Variables التالية:

- `STAGING_REPO_DIR`: `/home/mohammedalruwaily89/dala-ai-team-development`
- `STAGING_COMPOSE_DIR`: مسار مجلد Compose الخاص بـ Staging.
- `STAGING_COMPOSE_FILE`: اسم ملف Compose الخاص بـ Staging.
- `STAGING_COMPOSE_PROJECT`: اسم مشروع Compose، مثل `dala-ai-staging`.
- `STAGING_COMPOSE_SERVICE`: اسم خدمة التطبيق، مثل `app`.
- `STAGING_HEALTHCHECK_URL`: اختياري؛ يترك فارغاً حتى يتوفر رابط Staging صحيح.

## ما يفعله النشر

يتحقق من أن checkout نظيف، يجلب الفرع عبر HTTPS العام، يحدّثه بـ fast-forward فقط، ينسخ ملفات الكود إلى مجلد Compose مع استثناء `.env` وملفات التشغيل، ثم يبني خدمة التطبيق ويعيد تشغيلها وحدها. لا يلمس قاعدة البيانات أو خدمات Caddy أو Production.

يجب حماية فرع `codex/dala-ai-team` بالمراجعة، ويفضل تفعيل Required reviewers لبيئة `staging`. لا تضع `DATABASE_URL` أو أي كلمة مرور في Secrets الخاصة بالـWorkflow إلا إذا كانت مطلوبة صراحة؛ قاعدة البيانات تبقى من إعدادات `.env` على الخادم.
