@echo off
echo ==============================================
echo   RETOUR EN MODE AUTOMATIQUE (DHCP)
echo ==============================================
echo.
echo Activation du DHCP pour l'adresse IP...
netsh interface ip set address name="Wi-Fi" dhcp

echo.
echo Activation du DHCP pour les serveurs DNS...
netsh interface ip set dns name="Wi-Fi" dhcp

echo.
echo ==============================================
echo TERMINE ! Votre PC a retrouve son mode normal automatique.
echo ==============================================
echo.
pause
