@echo off
title Apartman Yonetim Uygulamasi
cd /d "%~dp0"

if not exist "uygulama\.venv\Scripts\python.exe" (
  echo Ilk kurulum yapilmamis gibi gorunuyor.
  echo Simdi 01_Ilk_Kurulum.bat aciliyor...
  call 01_Ilk_Kurulum.bat
)

if not exist "uygulama\.venv\Scripts\python.exe" (
  echo Kurulum tamamlanamadi.
  pause
  exit /b 1
)

call "uygulama\.venv\Scripts\activate.bat"
python uygulama\yerel_panel.py
