[CmdletBinding()]
param(
  [string]$SshHost = $(if ($env:DALA_STAGING_HOST) { $env:DALA_STAGING_HOST } else { "178.238.236.80" }),
  [string]$SshUser = $(if ($env:DALA_STAGING_USER) { $env:DALA_STAGING_USER } else { "mohammedalruwaily89" }),
  [string]$ComposeDir = $(if ($env:DALA_STAGING_COMPOSE_DIR) { $env:DALA_STAGING_COMPOSE_DIR } else { "/home/mohammedalruwaily89/dala-ai-staging-20260929" }),
  [string]$ComposeFile = $(if ($env:DALA_STAGING_COMPOSE_FILE) { $env:DALA_STAGING_COMPOSE_FILE } else { "docker-compose.yml" }),
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
command -v docker >/dev/null
command -v rsync >/dev/null
test -f $composeFileFullQ
rm -rf -- $remoteTempQ
mkdir -p -- $remoteTempQ
tar -xzf $remoteArchiveQ -C $remoteTempQ
rsync -a --exclude='.env' --exclude='node_modules/' --exclude='.next/' --exclude='data/' $remoteTempDirQ $composeDirSlashQ
cd $composeDirQ
docker compose -p $composeProjectQ -f $composeFileQ config --quiet
docker compose -p $composeProjectQ -f $composeFileQ build --pull $composeServiceQ
docker compose -p $composeProjectQ -f $composeFileQ up -d --no-deps --force-recreate $composeServiceQ
docker compose -p $composeProjectQ -f $composeFileQ ps $composeServiceQ
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
