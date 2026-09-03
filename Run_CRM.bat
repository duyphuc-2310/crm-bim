@echo off
title CRM BIM - Khoi dong ung dung
color 0A

echo.
echo =====================================================
echo   CRM QUAN LY DEAL BIM - KHOI DONG
echo =====================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Chua cai Node.js! Tai tai: https://nodejs.org
    pause
    exit
)

:: Check XAMPP MySQL
echo [1/3] Kiem tra MySQL XAMPP...
sc query MySQL >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] MySQL chua chay. Vui long bat XAMPP va chay MySQL truoc.
    echo     Sau do nhan phim bat ky de tiep tuc...
    pause
)

:: Install dependencies
echo [2/3] Cai dat thu vien Node.js...
cd /d "d:\QuanLyDealCRM"
if not exist "node_modules" (
    npm install
    echo [OK] Da cai dat thu vien!
) else (
    echo [OK] Thu vien da san sang!
)

:: Start server
echo [3/3] Khoi dong server...
echo.
echo =====================================================
echo   SERVER DANG CHAY!
echo   Truy cap: http://localhost:3000
echo   phpMyAdmin: http://localhost/phpmyadmin
echo   Nhan Ctrl+C de dung
echo =====================================================
echo.

start "" http://localhost:3000
node server/index.js

pause
