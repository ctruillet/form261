@echo off
setlocal
title Form261 Launcher
echo ==========================================
echo       Lancement de Form261 (Windows)
echo ==========================================

cd /d "%~dp0"

REM Verifier si Node.js est installe sous Windows
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Node.js detecte sur le systeme Windows.
    if not exist backend\node_modules (
        echo Installation des dependances backend...
        pushd backend && call npm install && popd
    )
    if not exist frontend\node_modules (
        echo Installation des dependances frontend...
        pushd frontend && call npm install && popd
    )
    if not exist node_modules (
        echo Installation des dependances racine...
        call npm install
    )
    echo.
    echo Demarrage simultane du backend et du frontend...
    call npm run dev
    goto end
)

REM Sinon delegation a WSL Ubuntu
where wsl >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Node.js non detecte sous Windows. Utilisation de WSL (Ubuntu)...
    wsl -d Ubuntu -- bash -c "cd /home/ctruillet/form261 && ./form261.sh"
    goto end
)

echo [ERREUR] Ni Node.js ni WSL n'ont ete trouves sur votre machine.
echo Veuillez installer Node.js (https://nodejs.org) ou WSL.
pause

:end
