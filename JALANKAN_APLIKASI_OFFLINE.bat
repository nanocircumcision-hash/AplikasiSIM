@echo off
title Sistem Informasi & Operasional Klinik Khitan (Offline Mode)
color 0B
echo ======================================================================
echo    SISTEM OPERASIONAL & MANAJEMEN KLINIK KHITAN
echo    (1-Click Startup - Mode Offline Mandiri)
echo ======================================================================
echo.

:: Cek apakah folder node_modules sudah ada
if not exist "node_modules\" (
    echo [INFO] Menyiapkan modul aplikasi pertama kali...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal menginstal dependencies. Pastikan Node.js terpasang.
        pause
        exit /b %errorlevel%
    )
)

echo [INFO] Membuka browser ke http://localhost:3000 ...
start "" "http://localhost:3000"

echo [INFO] Menjalankan server lokal klinik...
echo Tekan Ctrl + C di jendela ini jika ingin mematikan aplikasi.
echo.
call npm run dev

pause
