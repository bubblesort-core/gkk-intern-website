@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo      GKK-HIRE AUTO DEPLOYMENT SCRIPT
echo ==========================================

set ROOT=%~dp0
pushd "%ROOT%"

REM Clean previous build
echo [0/5] Cleaning production_dist...
if exist "production_dist" (
    rmdir /s /q "production_dist"
)
mkdir "production_dist"

echo [1/5] Building Apply Form (gkk-bento-form)...
pushd "gkk-bento-form"
call npm run build
if %errorlevel% neq 0 (
    echo Error building gkk-bento-form!
    popd
    exit /b %errorlevel%
)
popd

echo [2/5] Building Dashboard (React)...
pushd "Dashboard"
call npm run build
if %errorlevel% neq 0 (
    echo Error building Dashboard!
    popd
    exit /b %errorlevel%
)
popd

echo [3/5] Building Landing Page (GKK-HIRE-MAIN)...
pushd "GKK-HIRE-MAIN"
call npm run build
if %errorlevel% neq 0 (
    echo Error building GKK-HIRE-MAIN!
    popd
    exit /b %errorlevel%
)
popd

echo [4/5] Building Community Chat...
pushd "community-chat"
call npm run build
if %errorlevel% neq 0 (
    echo Error building Community Chat!
    popd
    exit /b %errorlevel%
)
popd

echo [5/5] Assembling Production Build...

REM 1. Copy Landing Page (Root)
robocopy "GKK-HIRE-MAIN\dist" "production_dist" /E /NFL /NDL /NJH /NJS /NC /NS >nul
if %errorlevel% geq 8 (
    echo Error copying Landing Page artifacts!
    exit /b 1
)

REM 2. Copy Dashboard to /dashboard
mkdir "production_dist\dashboard"
robocopy "Dashboard\dist" "production_dist\dashboard" /E /NFL /NDL /NJH /NJS /NC /NS >nul
if %errorlevel% geq 8 (
    echo Error copying Dashboard artifacts!
    exit /b 1
)

REM 2.5 Move Admin, CSS, JS, User to Root (for legacy paths)
echo Moving legacy folders to root...
robocopy "production_dist\dashboard\admin" "production_dist\admin" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul
robocopy "production_dist\dashboard\css" "production_dist\css" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul
robocopy "production_dist\dashboard\js" "production_dist\js" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul
robocopy "production_dist\dashboard\user" "production_dist\user" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul

REM 2.6 Copy Logo to Root Assets (for admin)
robocopy "production_dist\dashboard\assets" "production_dist\assets" "gkk-intern-logo.png" "bubblesort-logo.png" /NFL /NDL /NJH /NJS /NC /NS >nul

REM 3. Copy Apply Form to /dashboard/apply
mkdir "production_dist\dashboard\apply"
robocopy "gkk-bento-form\dist" "production_dist\dashboard\apply" /E /NFL /NDL /NJH /NJS /NC /NS >nul
if %errorlevel% geq 8 (
    echo Error copying Apply Form artifacts!
    exit /b 1
)

REM 4. Copy Community Chat to /community-chat
mkdir "production_dist\community-chat"
robocopy "community-chat\dist" "production_dist\community-chat" /E /NFL /NDL /NJH /NJS /NC /NS >nul
if %errorlevel% geq 8 (
    echo Error copying Community Chat artifacts!
    exit /b 1
)

REM 5. Create _redirects for Netlify SPA routing
echo Creating _redirects file...
(
echo /supabase-main/*  https://hjpsyxqakzrhvzegehtm.supabase.co/:splat  200!
echo /supabase-chat/*  https://mwnpwuxrbaousgwgoyco.supabase.co/:splat  200!
echo /storage-main/*   https://hjpsyxqakzrhvzegehtm.supabase.co/storage/v1/object/public/:splat  200!
echo /storage-chat/*   https://mwnpwuxrbaousgwgoyco.supabase.co/storage/v1/object/public/:splat  200!
echo /dashboard/admin/*  /admin/:splat  301
echo /dashboard/css/*    /css/:splat    301
echo /dashboard/js/*     /js/:splat     301
echo /dashboard/apply/*  /dashboard/apply/index.html  200
echo /Dashboard/*        /dashboard/:splat        301
echo /dashboard/*        /dashboard/index.html        200
echo /community-chat/*   /community-chat/index.html   200
echo /*                  /index.html                  200
) > "production_dist\_redirects"

echo ==========================================
echo      DEPLOYMENT BUILD COMPLETE!
echo ==========================================
echo Ready for deployment. Run 'netlify deploy --prod' inside root directory (selecting production_dist).
popd
pause
