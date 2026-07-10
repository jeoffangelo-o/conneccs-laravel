@echo off
echo ========================================
echo Get SHA-1 Fingerprint for Android OAuth
echo ========================================
echo.

set KEYSTORE_PATH=%USERPROFILE%\.android\debug.keystore

echo Checking for debug keystore...
if exist "%KEYSTORE_PATH%" (
    echo ✓ Found debug keystore at: %KEYSTORE_PATH%
    echo.
) else (
    echo ❌ Debug keystore not found at: %KEYSTORE_PATH%
    echo.
    echo This keystore will be created when you build an Android app.
    echo.
    echo Options:
    echo 1. Build your Expo app once: npm run android
    echo 2. Or create it manually - see GET_SHA1_FINGERPRINT.md
    echo.
    pause
    exit /b 1
)

echo Checking for Java/keytool...
where keytool >nul 2>&1
if errorlevel 1 (
    echo ❌ keytool not found in PATH
    echo.
    echo Searching for Java installation...
    
    REM Try common Java locations
    if exist "C:\Program Files\Java" (
        dir "C:\Program Files\Java" /b
        echo.
        echo Found Java installations above.
        echo Please add keytool to your PATH or see GET_SHA1_FINGERPRINT.md
    ) else (
        echo Java JDK not found. Please install Java JDK first.
        echo Download from: https://www.oracle.com/java/technologies/downloads/
    )
    echo.
    pause
    exit /b 1
)

echo ✓ keytool found
echo.
echo ========================================
echo Running keytool to get SHA-1...
echo ========================================
echo.

keytool -list -v -keystore "%KEYSTORE_PATH%" -alias androiddebugkey -storepass android -keypass android

echo.
echo ========================================
echo Instructions:
echo ========================================
echo.
echo 1. Look for the line that starts with "SHA1:"
echo 2. Copy the entire fingerprint (includes colons)
echo    Example: DA:39:A3:EE:5E:6B:4B:0D:32:55:BF:EF:95:60:18:90:AF:D8:07:09
echo.
echo 3. Go to Google Cloud Console
echo    Navigate to: Google Auth Platform -^> Clients
echo.
echo 4. Create or edit your Android client
echo    - Package name: com.conneccs
echo    - Paste the SHA-1 fingerprint
echo    - Save
echo.
echo 5. Copy the generated Client ID
echo.
echo 6. Add it to frontend/.env:
echo    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-client-id
echo.
echo ========================================
echo.
pause
