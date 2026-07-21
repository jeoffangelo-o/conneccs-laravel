@echo off
echo ====================================
echo  Setup Reportorial File Management
echo ====================================
echo.

echo Running migrations...
php artisan migrate

echo.
echo Seeding reportorial folders...
php artisan db:seed --class=ReportorialFolderSeeder

echo.
echo Creating storage link (if not exists)...
php artisan storage:link

echo.
echo ====================================
echo  Setup Complete!
echo ====================================
echo.
echo You can now use the reportorial file management system.
echo The following folders have been created:
echo   1. LETTER OF INTENT
echo   2. PERMIT TO TEACH
echo   3. WORKLOAD SCHEDULE OF FACULTY
echo   4. APPROVED SYLLABUS
echo   5. CLASS MONITORING CHECKLIST
echo   6. COMPUTATION OF MIDTERM GRADES
echo   7. LIST OF DROPPED STUDENT
echo   8. CLASS OBSERVATION
echo   9. APPROVED TOS W/ Test Question ^& KEY to correction
echo   10. APPROVED RUBRIC OF ASSESSMENT W/ ATTACHED PROBLEM/ SAMPLE OUTPUT
echo   11. SIAS GRADE SHEET
echo   12. LIST OF TOP TEN
echo   13. DELIQUENCY REPORT
echo   14. DEAN'S ^& PRESIDENT LIST
echo   15. APPROVED CLASS RECORD
echo.
pause
