@echo off
title Apartman Yonetim Uygulamasi - Excelden Yenile
cd /d "%~dp0"

if not exist "uygulama\.venv\Scripts\python.exe" (
  echo Ilk kurulum yapilmamis gibi gorunuyor.
  echo Once 01_Ilk_Kurulum.bat dosyasini calistir.
  pause
  exit /b 1
)

call "uygulama\.venv\Scripts\activate.bat"
python uygulama\excelden_yenile.py
echo.
pause
