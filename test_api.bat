@echo off
echo ========================================
echo Testing Conneccs Laravel API
echo ========================================
echo.

echo [1/4] Testing API availability...
curl -s http://localhost:8000/api/auth/login -o nul
if errorlevel 1 (
    echo ❌ Backend is not running!
    echo Please start backend: cd backend ^&^& php artisan serve
    pause
    exit /b 1
) else (
    echo ✓ Backend is running
)
echo.

echo [2/4] Testing registration with CSPC email...
curl -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test.user@cspc.edu.ph\",\"password\":\"password123\",\"role\":\"FACULTY\"}"
echo.
echo.

echo [3/4] Testing login...
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test.user@cspc.edu.ph\",\"password\":\"password123\"}"
echo.
echo.

echo [4/4] Testing email domain validation (should fail)...
curl -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Invalid\",\"lastName\":\"Email\",\"email\":\"invalid@gmail.com\",\"password\":\"password123\",\"role\":\"FACULTY\"}"
echo.
echo.

echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Setup Google OAuth credentials (see GOOGLE_OAUTH_SETUP.md)
echo 2. Start frontend: cd frontend ^&^& npm start
echo 3. Test authentication in the app
echo.
pause
