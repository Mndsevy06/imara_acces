@echo off
echo ==============================================
echo   CONFIGURATION DE L'IP FIXE (192.168.1.151)
echo ==============================================
echo.
echo Desactivation du mode automatique et assignation de l'IP statique...
netsh interface ip set address name="Wi-Fi" static 192.168.1.207 255.255.255.0 192.168.1.1

echo.
echo Configuration des serveurs DNS (Google + Box Internet)...
netsh interface ip set dns name="Wi-Fi" static 8.8.8.8
netsh interface ip add dns name="Wi-Fi" 192.168.1.1 index=2

echo.
echo ==============================================
echo TERMINE ! Votre PC a maintenant l'IP FIXE : 
echo ==============================================
echo.
pause
