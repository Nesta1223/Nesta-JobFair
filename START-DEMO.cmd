@echo off
cd /d "%~dp0"
if not exist node_modules\express (
  echo Run npm ci in this folder before starting the demo.
  pause
  exit /b 1
)
echo Starting the disposable Nesta demo. Press Ctrl+C to stop.
call npm.cmd run demo
pause
