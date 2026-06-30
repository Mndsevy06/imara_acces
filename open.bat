@echo off
echo Démarrage du projet Imara Acces...

echo.
echo Démarrage du Backend...
start "Imara Backend" cmd /k "cd /d "%~dp0Backend" && npm run dev"

echo.
echo Démarrage du Frontend...
start "Imara Frontend" cmd /k "cd /d "%~dp0Frontend" && npm run dev"

echo.
echo Les deux services sont en cours de démarrage dans de nouvelles fenêtres !
pause
