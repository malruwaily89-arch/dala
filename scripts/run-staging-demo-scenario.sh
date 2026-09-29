#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f prisma/reset-demo-scenario.ts || ! -x node_modules/.bin/tsx ]]; then
  echo "شغّل هذا السكربت من جذر dala-ai-team-development بعد تثبيت الحزم." >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  staging_url="$(docker inspect dala-ai-staging-app-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n 's/^DATABASE_URL=//p')"
  staging_ip="$(docker inspect dala-ai-staging-db-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')"
  if [[ -z "$staging_url" || -z "$staging_ip" ]]; then
    echo "تعذر العثور على اتصال قاعدة Staging داخل الحاويات." >&2
    exit 1
  fi
  export DATABASE_URL="$(printf '%s' "$staging_url" | sed -E "s#(@)[^/@]+(:[0-9]+)?/#\1${staging_ip}\2/#")"
fi

if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "تم منع التشغيل لأن NODE_ENV=production." >&2
  exit 1
fi

./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/prisma generate

if [[ -z "${DALA_DEMO_OWNER_PASSWORD:-}" ]]; then
  read -rsp "أدخل كلمة مرور حسابات Staging التجريبية: " DALA_DEMO_OWNER_PASSWORD
  echo
  export DALA_DEMO_OWNER_PASSWORD
fi

export DALA_SCENARIO_SCOPE=demo-slugs
export DALA_SCENARIO_CONFIRM=RESET_DEMO_DATA
export DALA_SCENARIO_BOOTSTRAP=YES

./node_modules/.bin/tsx prisma/reset-demo-scenario.ts
./node_modules/.bin/tsx prisma/verify-demo-scenario.ts
