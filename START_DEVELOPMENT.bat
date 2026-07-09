@echo off
echo ========================================
echo ConneCCS Development Environment
echo ========================================
echo.
echo This script will start both backend and frontend servers.
echo Make sure you have completed the installation checklist first!
echo.
pause

echo.
echo Starting Backend Server (Laravel)...
echo ========================================
start cmd /k "cd backend && echo Backend Server Starting... && php artisan serve"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server (Expo)...
echo ========================================
start cmd /k "cd frontend && echo Frontend Server Starting... && npm start"

echo.
echo ========================================
echo Both servers are starting...
echo.
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:8081
echo.
echo Two terminal windows have opened:
echo   1. Backend (Laravel) - Keep this running
echo   2. Frontend (Expo) - Press 'w' to open in browser
echo.
echo To stop servers: Press Ctrl+C in each window
echo ========================================
pause
