@echo off
title Apartman Yonetim Uygulamasi - Ilk Kurulum
cd /d "%~dp0"

echo ==================================================
echo   Apartman Yonetim Uygulamasi - Ilk Kurulum
echo ==================================================
echo.

py --version >nul 2>nul
if errorlevel 1 (
  echo Python bulunamadi.
  echo Once su adresten Python kur:
  echo https://www.python.org/downloads/windows/
  echo Kurarken "Add Python to PATH" kutusunu isaretle.
  pause
  exit /b 1
)

if not exist "uygulama\.venv" (
  echo Yerel calisma ortami olusturuluyor...
  py -m venv uygulama\.venv
)

echo Gerekli paketler kuruluyor...
call "uygulama\.venv\Scripts\activate.bat"
python -m pip install --upgrade pip
python -m pip install -r uygulama\gereksinimler.txt

echo.
echo Kurulum tamamlandi.
echo Bundan sonra her seferinde sadece:
echo 02_Paneli_Ac.bat
echo dosyasina cift tiklaman yeterli.
echo.
pause
