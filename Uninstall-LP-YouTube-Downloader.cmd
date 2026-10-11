@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\LP YouTube Downloader\installer\uninstall.ps1" %*
pause
