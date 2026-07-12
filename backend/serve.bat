@echo off
echo Starting Laravel server on all network interfaces...
echo Server will be accessible at:
echo - http://localhost:8000
echo - http://192.168.100.15:8000
echo.
echo Press Ctrl+C to stop the server
echo.
php artisan serve --host=0.0.0.0 --port=8000
