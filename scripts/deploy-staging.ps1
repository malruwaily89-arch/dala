[CmdletBinding()]
param(
  [string]$SshHost = $(if ($env:DALA_STAGING_HOST) { $env:DALA_STAGING_HOST } else { "178.238.236.80" }),
  [string]$SshUser = $(if ($env:DALA_STAGING_USER) { $env:DALA_STAGING_USER } else { "mohammedalruwaily89" }),
  [string]$ComposeDir = $(if ($env:DALA_STAGING_COMPOSE_DIR) { $env:DALA_STAGING_COMPOSE_DIR } else { "/home/mohammedalruwaily89/dala-ai-staging-20260929" }),
  [string]$ComposeFile = $(if ($env:DALA_STAGING_COMPOSE_FILE) { $env:DALA_STAGING_COMPOSE_FILE } else { "compose.staging.yml" }),
  [string]$ComposeProject = $(if ($env:DALA_STAGING_COMPOSE_PROJECT) { $env:DALA_STAGING_COMPOSE_PROJECT } else { "dala-ai-staging" }),
  [string]$ComposeService = $(if ($env:DALA_STAGING_COMPOSE_SERVICE) { $env:DALA_STAGING_COMPOSE_SERVICE } else { "app" }),
  [string]$SshKeyPath = $(if ($env:DALA_STAGING_SSH_KEY_PATH) { $env:DALA_STAGING_SSH_KEY_PATH } else { "" })
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "الأداة المطلوبة غير موجودة: $Name"
  }
}

function Quote-Bash([string]$Value) {
  $escaped = $Value.Replace("'", "'\''")
  return "'" + $escaped + "'"
}

Require-Command "git"
Require-Command "ssh"
Require-Command "scp"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
if (-not (Test-Path ".git")) { throw "شغّل السكربت من داخل مستودع Dala." }

$dirty = @(git status --porcelain)
$unexpected = @($dirty | Where-Object { $_ -notmatch '^\?\? \.codex(?:/|\\)' })
if ($unexpected.Count -gt 0) {
  throw "المستودع يحتوي تغييرات غير محفوظة. احفظها أو نظّفها قبل النشر:`n$($unexpected -join "`n")"
}

$commit = (git rev-parse --short HEAD).Trim()
$archive = Join-Path $env:TEMP "dala-staging-$commit.tar.gz"
$remoteArchive = "/tmp/dala-staging-$commit.tar.gz"
$remoteTemp = "/tmp/dala-staging-$commit"
$target = "$SshUser@$SshHost"

$sshOptions = @()
if ($SshKeyPath) {
  if (-not (Test-Path -LiteralPath $SshKeyPath)) { throw "ملف مفتاح SSH غير موجود: $SshKeyPath" }
  $sshOptions += @("-i", $SshKeyPath)
}

try {
  Write-Host "تجهيز commit $commit للنشر إلى Staging..." -ForegroundColor Cyan
  if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
  git archive --format=tar.gz --output=$archive HEAD
  if ($LASTEXITCODE -ne 0) { throw "تعذر إنشاء أرشيف الكود." }

  Write-Host "رفع الأرشيف إلى $target ..." -ForegroundColor Cyan
  & scp @sshOptions $archive "${target}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "فشل رفع الأرشيف. سيتطلب SSH كلمة المرور أو مفتاحًا صالحًا." }

  $remoteTempQ = Quote-Bash $remoteTemp
  $remoteArchiveQ = Quote-Bash $remoteArchive
  $composeDirQ = Quote-Bash $ComposeDir
  $composeFileQ = Quote-Bash $ComposeFile
  $composeFileFullQ = Quote-Bash "$ComposeDir/$ComposeFile"
  $remoteTempDirQ = Quote-Bash "$remoteTemp/"
  $composeDirSlashQ = Quote-Bash "$ComposeDir/"
  $composeProjectQ = Quote-Bash $ComposeProject
  $composeServiceQ = Quote-Bash $ComposeService

  $remoteScript = @"
set -eu
command -v docker >/dev/null || { echo 'DEPLOY_ERROR: docker غير موجود على السيرفر' >&2; exit 1; }
command -v rsync >/dev/null || { echo 'DEPLOY_ERROR: rsync غير موجود على السيرفر' >&2; exit 1; }
command -v tar >/dev/null || { echo 'DEPLOY_ERROR: tar غير موجود على السيرفر' >&2; exit 1; }
if [ ! -f $composeFileFullQ ]; then
  echo 'DEPLOY_ERROR: ملف Compose غير موجود قبل النسخ' >&2
  echo 'المسار المتوقع:' $composeFileFullQ >&2
  exit 1
fi
cd $composeDirQ
compose_service=$composeServiceQ
if ! docker compose -p $composeProjectQ -f $composeFileQ config --services | grep -Fx "`$compose_service" >/dev/null; then
  echo 'DEPLOY_ERROR: خدمة Compose المطلوبة غير موجودة قبل النسخ' >&2
  echo 'الخدمات الموجودة:' >&2
  docker compose -p $composeProjectQ -f $composeFileQ config --services >&2 || true
  echo 'الخدمة المطلوبة:' "`$compose_service" >&2
  exit 1
fi
rm -rf -- $remoteTempQ
mkdir -p -- $remoteTempQ
tar -xzf $remoteArchiveQ -C $remoteTempQ
rsync -a --exclude='.env' --exclude='node_modules/' --exclude='.next/' --exclude='data/' --exclude='docker-compose.yml' --exclude='docker-compose.yaml' --exclude='compose.yml' --exclude='compose.yaml' --exclude='compose.staging.yml' $remoteTempDirQ $composeDirSlashQ
if [ ! -f $composeFileFullQ ]; then
  echo 'DEPLOY_ERROR: ملف Compose غير موجود بعد نسخ الملفات' >&2
  echo 'المجلد المتوقع:' $composeDirQ >&2
  ls -la $composeDirQ >&2 || true
  exit 1
fi
echo 'التحقق من إعداد Compose...' >&2
docker compose -p $composeProjectQ -f $composeFileQ config --quiet
echo 'بناء خدمة Staging...' >&2
docker compose -p $composeProjectQ -f $composeFileQ build --pull "`$compose_service"
echo 'إعادة تشغيل خدمة Staging...' >&2
docker compose -p $composeProjectQ -f $composeFileQ up -d --no-deps --force-recreate "`$compose_service"
docker compose -p $composeProjectQ -f $composeFileQ ps "`$compose_service"
rm -f -- $remoteArchiveQ
rm -rf -- $remoteTempQ
"@

  Write-Host "بناء وإعادة تشغيل خدمة Staging فقط..." -ForegroundColor Cyan
  & ssh @sshOptions $target $remoteScript
  if ($LASTEXITCODE -ne 0) { throw "فشل تنفيذ النشر على Staging." }
  Write-Host "اكتمل نشر Staging للـ commit $commit." -ForegroundColor Green
}
finally {
  if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue }
}
