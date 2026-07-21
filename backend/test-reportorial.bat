@echo off
echo ========================================
echo Testing Reportorial System Setup
echo ========================================
echo.

echo 1. Checking migrations...
php artisan migrate:status | findstr "reportorial"
echo.

echo 2. Checking folders in database...
php artisan tinker --execute="echo 'Total folders: ' . App\Models\ReportorialFolder::count(); echo PHP_EOL; App\Models\ReportorialFolder::orderBy('order')->get(['id', 'name', 'icon'])->each(fn($f) => print($f->id . '. ' . $f->name . PHP_EOL));"
echo.

echo 3. Checking storage directory...
if exist "storage\app\public\reportorial" (
    echo ✓ Reportorial storage directory exists
) else (
    echo ✗ Reportorial storage directory NOT found
)
echo.

echo 4. Checking storage link...
if exist "public\storage" (
    echo ✓ Storage link exists
) else (
    echo ✗ Storage link NOT found
)
echo.

echo 5. Checking API routes...
php artisan route:list --path=reportorial
echo.

echo ========================================
echo Setup verification complete!
echo ========================================
pause
