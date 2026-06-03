# ─────────────────────────────────────────────────────────────
#  IMARA ACCESS — Partage réseau local
#  Lance le frontend accessible depuis n'importe quel appareil
#  connecté au même Wi-Fi / réseau.
#
#  Usage   : clic droit -> "Exécuter avec PowerShell"
#            OU dans un terminal : .\share-local.ps1
#
#  Suppression : ce fichier peut être supprimé à tout moment
#  sans aucun impact sur l'application.
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  IMARA ACCESS — Mode partage réseau local" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray

# Récupère l'adresse IP locale (Wi-Fi ou Ethernet)
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169' } |
       Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  Votre adresse IP locale : $ip" -ForegroundColor Yellow
Write-Host "  Ouvrez sur un autre appareil : http://${ip}:5173" -ForegroundColor Green
Write-Host ""
Write-Host "  Appuyez sur Ctrl+C pour arrêter." -ForegroundColor DarkGray
Write-Host ""

# Lance Vite avec --host pour exposer sur le réseau local
# N'impacte PAS vite.config.ts ni package.json
Set-Location $PSScriptRoot
npx vite --host 0.0.0.0
