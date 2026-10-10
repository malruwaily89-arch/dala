#!/usr/bin/env bash
# One-time setup on the VPS (safe to re-run). Asks only for the secrets, then builds and starts the
# assistant, adds its domain to Caddy (backup + validation, n8n untouched) and points Meta's webhook at it.
set -euo pipefail
cd "$(dirname "$0")"

DOMAIN="${DOMAIN:-agent.d-alal.com}"
CADDY="${CADDY_CONTAINER:-mohammedalruwaily89-caddy-1}"
CADDYFILE="${CADDYFILE:-$HOME/Caddyfile}"
DALA_ENV="${DALA_ENV:-$HOME/dala/.env}"

step() { printf '\n== %s ==\n' "$1"; }
fail() { printf '❌ %s\n' "$1" >&2; exit 1; }
from_dala() { if [ -f "$DALA_ENV" ]; then sed -n "s/^$1=//p" "$DALA_ENV" | head -1 | tr -d "\"'"; fi; }
json() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)" 2>/dev/null || true; }

# ask VAR "label" [secret] [default]
ask() {
  local var=$1 label=$2 secret=${3:-} default=${4:-} value=""
  [ -n "$default" ] && label="$label (Enter = نفس قيمة دلال)"
  if [ "$secret" = secret ]; then read -r -s -p "$label: " value; echo; else read -r -p "$label: " value; fi
  value=${value:-$default}
  [ -n "$value" ] || fail "القيمة مطلوبة: $label"
  printf -v "$var" '%s' "$value"
}

step "فحص السيرفر"
command -v docker >/dev/null || fail "docker غير موجود"
docker ps --format '{{.Names}}' | grep -qx "$CADDY" || fail "حاوية Caddy ($CADDY) مو شغالة"
[ -f "$CADDYFILE" ] || fail "ما لقيت $CADDYFILE"
SERVER_IP=$(curl -s -4 --max-time 10 ifconfig.me || true)
DNS_IP=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1 {print $1}' || true)
[ -n "$SERVER_IP" ] && [ "$DNS_IP" = "$SERVER_IP" ] ||
  fail "الدومين $DOMAIN يشير إلى '${DNS_IP:-لا شيء}' بدل '${SERVER_IP:-?}'. أضف سجل A باسم agent يشير إلى IP السيرفر، وبعد دقائق أعد تشغيل السكربت."
echo "✔ Docker و Caddy شغالين، و $DOMAIN يشير للسيرفر ($SERVER_IP)"

step "الإعدادات"
if [ -f .env ]; then
  echo "✔ ملف .env موجود وبستخدمه (احذفه إذا تبي تدخل القيم من جديد)"
  set -a; . ./.env; set +a
else
  ask ANTHROPIC_API_KEY "مفتاح Claude (ANTHROPIC_API_KEY)" secret
  ask WHATSAPP_ACCESS_TOKEN "توكن واتساب الدائم (WHATSAPP_ACCESS_TOKEN)" secret "$(from_dala WHATSAPP_ACCESS_TOKEN)"
  ask WHATSAPP_APP_SECRET "App Secret لتطبيق Meta" secret "$(from_dala WHATSAPP_APP_SECRET)"
  ask WHATSAPP_PHONE_NUMBER_ID "Phone number ID لرقم المساعد" "" "$(from_dala WHATSAPP_PHONE_NUMBER_ID)"
  ask OWNER_WHATSAPP_NUMBER "رقم جوالك الشخصي (مثال 05XXXXXXXX)"
  OWNER_WHATSAPP_NUMBER=$(printf '%s' "$OWNER_WHATSAPP_NUMBER" | tr -cd '0-9' | sed -e 's/^00//' -e 's/^05/9665/')
  WHATSAPP_VERIFY_TOKEN=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
  WHATSAPP_API_VERSION=$(from_dala WHATSAPP_API_VERSION)
  WHATSAPP_API_VERSION=${WHATSAPP_API_VERSION:-v21.0}
  FILES_HOST_DIR="$HOME/assistant-files"
  (
    umask 077
    cat > .env <<EOF
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
AGENT_MODEL=claude-opus-5-5
WHATSAPP_ACCESS_TOKEN=$WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=$WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_APP_SECRET=$WHATSAPP_APP_SECRET
WHATSAPP_VERIFY_TOKEN=$WHATSAPP_VERIFY_TOKEN
WHATSAPP_API_VERSION=$WHATSAPP_API_VERSION
OWNER_WHATSAPP_NUMBER=$OWNER_WHATSAPP_NUMBER
FILES_HOST_DIR=$FILES_HOST_DIR
HOST_UID=$(id -u)
HOST_GID=$(id -g)
EOF
  )
  echo "✔ انحفظت الإعدادات في .env (مقروءة لك فقط). رقمك المسجل: $OWNER_WHATSAPP_NUMBER"
fi
FILES_HOST_DIR=${FILES_HOST_DIR:-$HOME/assistant-files}
GRAPH="https://graph.facebook.com/$WHATSAPP_API_VERSION"

# Secrets go to curl through files/stdin, never on the command line.
SECRETS=$(mktemp -d)
trap 'rm -rf "$SECRETS"' EXIT
printf 'Authorization: Bearer %s\n' "$WHATSAPP_ACCESS_TOKEN" > "$SECRETS/auth"
printf '%s' "$WHATSAPP_ACCESS_TOKEN" > "$SECRETS/token"

step "التحقق من رقم المساعد في واتساب"
PHONE=$(curl -s --max-time 20 -H @"$SECRETS/auth" "$GRAPH/$WHATSAPP_PHONE_NUMBER_ID?fields=display_phone_number,verified_name")
DISPLAY=$(printf '%s' "$PHONE" | json 'd.get("display_phone_number","")')
[ -n "$DISPLAY" ] || fail "واتساب رفض التوكن أو الـ Phone number ID: $PHONE"
echo "✔ رقم المساعد: $DISPLAY ($(printf '%s' "$PHONE" | json 'd.get("verified_name","")'))"

step "تشغيل المساعد"
mkdir -p state "$FILES_HOST_DIR"
docker compose up -d --build
for i in $(seq 1 30); do
  docker exec "$CADDY" wget -qO- http://assistant:3300/health 2>/dev/null | grep -qx ok && break
  [ "$i" = 30 ] && fail "الخدمة ما ردت. السجل: docker compose logs assistant"
  sleep 2
done
echo "✔ المساعد شغال و Caddy يوصل له"

step "إضافة $DOMAIN إلى Caddy"
if grep -qF "$DOMAIN" "$CADDYFILE"; then
  echo "✔ الدومين موجود أصلاً في Caddyfile"
else
  BACKUP="$CADDYFILE.bak-$(date +%Y%m%d-%H%M%S)"
  cp "$CADDYFILE" "$BACKUP"
  # Append in place: the Caddyfile is a single-file bind mount, so its inode must not change.
  printf '\n%s {\n\treverse_proxy assistant:3300\n}\n' "$DOMAIN" >> "$CADDYFILE"
  if ! docker exec "$CADDY" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
    cat "$BACKUP" > "$CADDYFILE"
    fail "Caddy رفض الإعداد، ورجعت الملف زي ما كان (النسخة: $BACKUP)"
  fi
  docker exec "$CADDY" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  echo "✔ انضاف الدومين بدون إعادة تشغيل Caddy (نسخة احتياطية: $BACKUP)"
fi
for i in $(seq 1 30); do
  curl -s --max-time 5 "https://$DOMAIN/health" | grep -qx ok && break
  [ "$i" = 30 ] && fail "https://$DOMAIN ما اشتغل. السجل: docker logs $CADDY --tail 30"
  sleep 3
done
echo "✔ https://$DOMAIN شغال بشهادة SSL"

step "ربط الـ webhook في Meta"
ask META_APP_ID "App ID لتطبيق Meta (أعلى صفحة التطبيق في developers.facebook.com)"
printf '%s|%s' "$META_APP_ID" "$WHATSAPP_APP_SECRET" > "$SECRETS/app"

TOKEN_INFO=$(curl -s --max-time 20 -G "$GRAPH/debug_token" --data-urlencode "input_token@$SECRETS/token" --data-urlencode "access_token@$SECRETS/app")
EXPIRES=$(printf '%s' "$TOKEN_INFO" | json 'd["data"].get("expires_at","")')
[ "$EXPIRES" = "0" ] || echo "⚠️ التوكن مؤقت وبينتهي. سوِّ توكن دائم من System User في Business Settings وحطه في .env"
WABA=$(printf '%s' "$TOKEN_INFO" | json 'next((s["target_ids"][0] for s in d["data"].get("granular_scopes",[]) if s.get("scope")=="whatsapp_business_messaging" and s.get("target_ids")), "")')
if [ -n "$WABA" ]; then
  SUB=$(curl -s --max-time 20 -X POST -H @"$SECRETS/auth" "$GRAPH/$WABA/subscribed_apps")
  printf '%s' "$SUB" | grep -q '"success":true' && echo "✔ حساب واتساب للأعمال ($WABA) مشترك في التطبيق" || echo "⚠️ ما قدرت أشترك حساب الأعمال في التطبيق: $SUB"
fi

RESULT=$(curl -s --max-time 30 -X POST "$GRAPH/$META_APP_ID/subscriptions" \
  -d object=whatsapp_business_account \
  --data-urlencode "callback_url=https://$DOMAIN/webhook" \
  --data-urlencode "verify_token=$WHATSAPP_VERIFY_TOKEN" \
  -d fields=messages \
  --data-urlencode "access_token@$SECRETS/app")
if printf '%s' "$RESULT" | grep -q '"success":true'; then
  echo "✔ Meta تحققت من https://$DOMAIN/webhook وصار يوصل له حقل messages"
else
  echo "⚠️ ما قدرت أربطه تلقائياً: $RESULT"
  echo "   اربطه يدوياً: تطبيق Meta ← WhatsApp ← Configuration"
  echo "   Callback URL: https://$DOMAIN/webhook"
  echo "   Verify token: $WHATSAPP_VERIFY_TOKEN"
  echo "   ثم اشترك في حقل messages"
fi

step "خلصنا"
echo "أرسل \"مرحبا\" من جوالك لرقم المساعد ($DISPLAY)."
echo "شخصية المساعد: اكتبها في $(pwd)/state/prompt.md ثم: docker compose restart"
echo "ملفاتك في: $FILES_HOST_DIR"
