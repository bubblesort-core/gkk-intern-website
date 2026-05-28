@echo off
setlocal
echo Deploying Supabase Edge Functions...

pushd "%~dp0"

call supabase functions deploy create-profile --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy create-profile!
    popd
    pause
    exit /b %errorlevel%
)

call supabase functions deploy send-otp --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy send-otp! Retrying with --debug...
    call supabase functions deploy send-otp --no-verify-jwt --debug
    if %errorlevel% neq 0 (
        echo Failed to deploy send-otp!
        popd
        pause
        exit /b %errorlevel%
    )
)

call supabase functions deploy send-decision-email --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy send-decision-email!
    popd
    pause
    exit /b %errorlevel%
)

call supabase functions deploy send-reminder-email --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy send-reminder-email!
    popd
    pause
    exit /b %errorlevel%
)

call supabase functions deploy send-application-email --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy send-application-email!
    popd
    pause
    exit /b %errorlevel%
)

call supabase functions deploy pandaa-assistant --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy pandaa-assistant!
    popd
    pause
    exit /b %errorlevel%
)

call supabase functions deploy initiate-payment --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy initiate-payment!
    popd
    pause
    exit /b %errorlevel%
)

call supabase functions deploy razorpay-order --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy razorpay-order!
    popd
    pause
    exit /b %errorlevel%
)

call supabase functions deploy razorpay-webhook --no-verify-jwt
if %errorlevel% neq 0 (
    echo Failed to deploy razorpay-webhook!
    popd
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo CRITICAL: YOU MUST CONFIGURE THE HOOK IN SUPABASE DASHBOARD
echo ========================================================
echo 1. Go to Authentication -> Hooks
echo 2. Enable "Send Email Hook" (or "Custom Email Provider")
echo 3. Select "Function" -> "send-otp"
echo    (Or paste the URL: https://<project-ref>.supabase.co/functions/v1/send-otp)
echo 4. Save
echo.
echo Also ensure Razorpay webhook is configured to:
echo https://<project-ref>.supabase.co/functions/v1/razorpay-webhook
echo ========================================================
echo.
pause

popd
endlocal
