@echo off
title ChargeNOC AI — EV Site Screener

echo.
echo  ============================================
echo   ChargeNOC AI — EV Charging Site Screener
echo  ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

:: Create venv if missing
if not exist ".venv\Scripts\python.exe" (
    echo  [1/3] Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 ( echo  [ERROR] Failed to create venv. & pause & exit /b 1 )
)

:: Install requirements
echo  [2/3] Installing requirements...
.venv\Scripts\python.exe -m pip install -q -r requirements.txt flask
if errorlevel 1 ( echo  [ERROR] pip install failed. Check internet. & pause & exit /b 1 )

:: Check .env
if not exist ".env" (
    echo.
    echo  [!] .env file not found.
    echo  Please create a .env file with:
    echo      GEMINI_API_KEY=your_key_here
    echo      GEMINI_MODEL=gemini-2.5-flash
    echo.
    pause
    exit /b 1
)

:: Start server and open browser
echo  [3/3] Starting web server...
echo.
echo  Opening browser at http://localhost:5000
echo  Press Ctrl+C in this window to stop the server.
echo.

:: Open browser after 2 seconds
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:5000"

:: Run the app
.venv\Scripts\python.exe app.py
pause
