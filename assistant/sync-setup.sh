#!/usr/bin/env bash
# Shares the assistant's files folder with a laptop over Syncthing (safe to re-run).
# Usage: ./sync-setup.sh <LAPTOP-DEVICE-ID>   (Syncthing on the laptop → Actions → Show ID)
set -euo pipefail
cd "$(dirname "$0")"

fail() { printf '❌ %s\n' "$1" >&2; exit 1; }

LAPTOP=$(printf '%s' "${1:-}" | tr '[:lower:]' '[:upper:]' | tr -d ' ')
[[ "$LAPTOP" =~ ^[A-Z2-7]{7}(-[A-Z2-7]{7}){7}$ ]] ||
  fail "اكتب معرّف جهاز اللابتوب من Syncthing (Actions ← Show ID)، مثال: ./sync-setup.sh ABCDEFG-HIJKLMN-..."
[ -f .env ] || fail "ما لقيت .env؛ شغّل setup.sh أول"
set -a; . ./.env; set +a
FILES_HOST_DIR=${FILES_HOST_DIR:-./files}

mkdir -p syncthing "$FILES_HOST_DIR"
for dir in syncthing "$FILES_HOST_DIR"; do
  [ "$(stat -c %u "$dir")" = "${HOST_UID:-1000}" ] ||
    fail "المجلد $dir مو ملك المستخدم ${HOST_UID:-1000}، وSyncthing ما بيقدر يكتب فيه. صلّحه بـ: sudo chown -R ${HOST_UID:-1000}:${HOST_GID:-1000} $dir"
done
docker compose --profile sync up -d syncthing

# Syncthing v2 needs the GUI API key; it lives in the container's own config, so it never leaves the container.
st() {
  docker exec assistant-syncthing sh -c 'STGUIAPIKEY=$(sed -n "s:.*<apikey>\(.*\)</apikey>.*:\1:p" /var/syncthing/config/config.xml | head -1) exec syncthing cli "$@"' sh "$@"
}
for i in $(seq 1 30); do
  st show system >/dev/null 2>&1 && break
  [ "$i" = 30 ] && fail "Syncthing ما اشتغل. السجل: docker logs assistant-syncthing --tail 30"
  sleep 2
done

st config devices list | grep -qx "$LAPTOP" ||
  st config devices add --device-id "$LAPTOP" --name laptop
st config folders list | grep -qx assistant-files ||
  st config folders add --id assistant-files --label "ملفات المساعد" --path /var/syncthing/assistant-files
st config folders assistant-files devices list | grep -qx "$LAPTOP" ||
  st config folders assistant-files devices add --device-id "$LAPTOP"

echo "✔ السيرفر جاهز يشارك $FILES_HOST_DIR مع اللابتوب"
echo "معرّف السيرفر: $(st show system | sed -n 's/.*"myID": *"\([^"]*\)".*/\1/p')"
echo "في Syncthing على اللابتوب بيطلع طلب إضافة الجهاز assistant-vps بنفس المعرّف: اضغط Add Device ثم Save."
echo "بعدها يطلع طلب مشاركة المجلد \"ملفات المساعد\": اضغط Add، واختر مكان المجلد على جهازك، ثم Save."
