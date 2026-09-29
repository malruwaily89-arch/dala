@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-staging.ps1" ^
  -ComposeDir "/home/mohammedalruwaily89/dala" ^
  -ComposeFile "docker-compose.yml" ^
  -ComposeProject "dala" ^
  -ComposeService "dala" %*
set "exitCode=%ERRORLEVEL%"
if not "%exitCode%"=="0" pause
exit /b %exitCode%
