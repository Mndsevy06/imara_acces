# Architecture Réseau et Problème d'IP : Le Guide Définitif

Ce document explique clairement comment les différentes parties de ton application communiquent et où se trouve le problème d'IP.

## 1. L'Analogie du Restaurant (Pour tout comprendre)

Imagine ton architecture comme un **Restaurant** :
- **Le PC (Backend)** = C'est le Restaurant.
- **Les Téléphones (Capacitor) et l'ESP32** = Ce sont les Clients.

Pour qu'un client puisse manger au restaurant, il a besoin de connaître l'adresse exacte du restaurant. 
- Est-ce grave si le client déménage ou change de voiture ? **Non.** (L'adresse IP des téléphones et de l'ESP32 peut changer tout le temps, on s'en fiche complètement).
- Est-ce grave si le Restaurant déménage sans prévenir ? **OUI !** (Si l'IP du PC change, ni les téléphones, ni l'ESP32 ne pourront le retrouver, et tout plante).

**CONCLUSION CRUCIALE :** C'est **UNIQUEMENT l'adresse IP du PC Windows** qu'il faut fixer. Peu importe si tu utilises 50 téléphones différents ou si tu changes de téléphone tous les jours. 

---

## 2. L'Architecture de l'Application (Imara Access)

Voici comment tes composants communiquent sur le réseau WiFi local :

1. **Le Backend (Base de données, Logique métier)**
   - Il tourne sur le **PC Windows**.
   - C'est le serveur. Il écoute sur le Port `8012`.
   - C'est lui qui DOIT avoir une adresse IP Statique (Fixe).

2. **Le Frontend Web (Navigateur PC)**
   - Tourne sur le PC. Il communique souvent via `localhost` avec le Backend, donc il n'a pas de problème réseau.

3. **L'Application Mobile (Capacitor / Android)**
   - Tourne sur les **Téléphones**.
   - Cherche l'adresse du serveur dans son fichier `.env` (`VITE_API_BASE_URL=http://192.168.1.153:8012`).
   - L'IP du téléphone change ? Aucun problème. Mais l'IP `192.168.1.153` écrite dans le code doit toujours correspondre à celle du PC.

4. **Le Boîtier IoT (ESP32)**
   - Tourne sur la carte physique.
   - Envoie les badges scannés au PC.
   - Comme pour le téléphone, l'ESP32 a besoin de savoir où est le PC.

---

## 3. Comment fixer l'IP du PC en Ligne de Commande (Admin)

Oui, il est tout à fait possible de fixer l'IP du PC en ligne de commande. Il faut ouvrir **PowerShell en tant qu'Administrateur** sur le PC.

*(Attention : remplace "Wi-Fi" par le nom exact de ta carte réseau si c'est différent, et mets la bonne passerelle).*

**Étape 1 : Trouver les infos actuelles**
```powershell
Get-NetIPConfiguration
```
*(Cela te donnera l'InterfaceAlias, l'IP actuelle et la DefaultGateway).*

**Étape 2 : Fixer l'IP (Exemple pour mettre 192.168.1.153)**
```powershell
New-NetIPAddress -InterfaceAlias "Wi-Fi" -IPAddress "192.168.1.153" -PrefixLength 24 -DefaultGateway "192.168.1.1"
```

**Étape 3 : Définir le serveur DNS (Indispensable pour avoir internet)**
```powershell
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses ("8.8.8.8","192.168.1.1")
```

Si tu ne veux pas risquer de faire une erreur en ligne de commande, le faire via l'interface graphique de Windows ou via l'application Starlink reste le plus sûr !

---

## 4. Que se passe-t-il si je me trompe ? (Les risques)

Si tu fais une erreur en tapant la commande (mauvaise IP, mauvaise passerelle...), **le seul risque est de perdre ta connexion Internet sur ce PC.** Rien de grave ni de définitif. 
Cela peut arriver si :
- Tu choisis une IP qui n'est pas dans le bon réseau.
- Tu choisis une IP qu'un autre appareil (comme une TV) utilise déjà (Conflit d'IP).

### 🆘 La Commande de Secours (Pour tout annuler)
Si tu n'as plus internet après la manipulation, pas de panique. Ouvre **PowerShell en Administrateur** et tape ces deux commandes pour **remettre ton PC en Automatique (DHCP)**, comme avant :

```powershell
Set-NetIPInterface -InterfaceAlias "Wi-Fi" -Dhcp Enabled
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ResetServerAddresses
```
Après ça, ton PC va redemander automatiquement une IP valide à ta Box Internet et tu retrouveras ta connexion en quelques secondes !
