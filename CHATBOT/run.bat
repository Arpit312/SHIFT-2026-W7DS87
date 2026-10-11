@echo off
title ChargeSathi Server
cd /d "%~dp0"

echo ======================================================
echo           Starting ChargeSathi Server...
echo ======================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js install nahi hai ya PATH me nahi hai!
    echo Kripya Node.js install karein: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if .env exists
if not exist .env (
    if exist .env.example (
        echo [INFO] .env file nahi mili, .env.example ko .env me copy kiya ja raha hai...
        copy .env.example .env >nul
        echo [WARN] Kripya .env file khol kar apni GEMINI_API_KEY check/set karein!
        echo.
    )
)

echo Browser khol rahe hain (http://localhost:3000)...
start "" http://localhost:3000

echo Server start ho raha hai... (Stop karne ke liye Ctrl + C dabayein)
echo.

node server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server unexpectedly stop ho gaya!
    pause
)
