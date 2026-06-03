# Schéma de la Base de Données — Imara / ECOPO Access

Analyse basée sur l'intégralité du frontend de l'application.

---

## Table 1 : `User`
Représente tous les comptes du système (admin, agent, adhérent/usager).

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `name` | String | Nom complet |
| `email` | String? | Email (requis pour ADMIN, optionnel sinon) |
| `passwordHash` | String? | Mot de passe hashé (ADMIN/AGENT) |
| `role` | Enum | `ADMIN` \| `AGENT` \| `MEMBER` |
| `profile` | Enum | `PROFESSEUR` \| `ETUDIANT` \| `PERSONNEL` \| `DIRECTION` \| `FIDELE` |
| `licensePlate` | String? | Plaque d'immatriculation (ex: `AA-482-BC`) |
| `cardId` | String? | UID de la carte NFC/RFID encodée |
| `avatar` | String? | URL de la photo de profil |
| `assignedParkingId` | FK | Parking par défaut assigné à l'adhérent |
| `presenceStatus` | Enum | `IN` \| `OUT` — véhicule actuellement sur site |
| `createdAt` | DateTime | Date de création du compte |
| `updatedAt` | DateTime | Dernière modification |

---

## Table 2 : `ParkingZone`
Les zones de stationnement physiques du site.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `name` | String | Nom affiché (ex: `Zone A`, `ECOPO`, `Église`) |
| `type` | Enum | `PROFESSOR` \| `STUDENT` \| `VISITOR` \| `STAFF` \| `CHURCH` |
| `capacity` | Int | Nombre total de places |
| `currentCount` | Int | Véhicules actuellement présents (compteur live) |
| `configurationId` | FK | Configuration système à laquelle ce parking appartient |

---

## Table 3 : `Agent`
Les agents de sécurité affectés aux portails (extension du compte `User`).

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `userId` | FK | Référence au compte `User` (role = AGENT) |
| `portail` | String | Portail assigné (ex: `Entrée Principale`, `Portail ECOPO`) |
| `status` | Enum | `ACTIVE` \| `OFFLINE` |
| `shiftStart` | String | Heure début de service (ex: `08:00`) |
| `shiftEnd` | String | Heure fin de service (ex: `16:00`) |
| `readerId` | FK | Lecteur de carte assigné |
| `configurationId` | FK | Configuration active pour cet agent |

---

## Table 4 : `CardReader`
Les dispositifs physiques de lecture de badges (NFC, RFID, QR).

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `label` | String | Nom affiché (ex: `Lecteur #001`) |
| `type` | Enum | `NFC` \| `RFID` \| `QR` |
| `location` | String | Emplacement physique (ex: `Portail ECOPO`) |
| `configurationId` | FK | Configuration à laquelle ce lecteur est rattaché |

---

## Table 5 : `AccessLog`
L'historique de tous les scans / événements d'accès. Table centrale du système.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `timestamp` | DateTime | Date et heure exacte du scan |
| `userId` | FK? | Usager identifié (null si inconnu) |
| `userNameSnapshot` | String | Nom copié au moment du scan (pour audit immuable) |
| `plateSnapshot` | String | Plaque copiée au moment du scan |
| `eventType` | Enum | `ENTREE` \| `SORTIE` |
| `parkingId` | FK | Zone de parking visée |
| `status` | Enum | `SUCCESS` \| `FAILED` |
| `failReason` | String? | Motif du refus (ex: `Parking Plein`, `Badge invalide`) |
| `agentId` | FK? | Agent qui a supervisé le scan |
| `readerId` | FK? | Lecteur qui a capté le badge |

---

## Table 6 : `Configuration`
Un "scénario de déploiement" : regroupe agents, parkings, carte et règles de routage.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `name` | String | Nom du scénario (ex: `Imara Principal 2026`) |
| `description` | Text | Contexte et mission de la configuration |
| `status` | Enum | `LOCKED` \| `EDITABLE` |
| `deployedAt` | DateTime | Date de mise en service |
| `tilemapId` | FK? | Carte tilemap liée |
| `createdAt` | DateTime | Date de création |

---

## Table 7 : `Tilemap`
La carte quadrillée du site, construite via l'éditeur visuel.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `name` | String | Nom de la carte (ex: `Carte Imara Campus v4.2`) |
| `width` | Int | Nombre de colonnes de la grille |
| `height` | Int | Nombre de lignes de la grille |
| `gridData` | JSON | Tableau 2D sérialisé contenant toutes les tuiles |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Dernière sauvegarde |

> Les tuiles sont stockées en JSON dans `gridData` plutôt qu'en lignes séparées, pour éviter des milliers de rows pour une grille 20×20.

**Structure d'une tuile dans `gridData` :**
```json
{
  "type": "PARKING | GATE | ROAD | BUILDING | ARROW_UP | ARROW_DOWN | ARROW_LEFT | ARROW_RIGHT | EMPTY",
  "label": "Entrée Est",
  "parkingName": "Zone A",
  "capacity": 50,
  "portalId": "PORT_PRINCIPAL"
}
```

---

## Table 8 : `RoutingRule`
Règles de fallback : si le parking principal est plein, vers lequel rediriger le conducteur.

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `configurationId` | FK | Configuration à laquelle s'applique la règle |
| `fromParkingId` | FK | Parking d'origine (plein) |
| `toParkingId` | FK | Parking de repli proposé |
| `priority` | Int | Ordre de priorité si plusieurs fallbacks existent |

---

## Table 9 : `SystemSettings`
Paramètres globaux de l'établissement (table singleton — 1 seule ligne).

| Champ | Type | Description |
|---|---|---|
| `id` | Int | Toujours `1` |
| `orgName` | String | Nom de l'établissement |
| `supportEmail` | String | Email de support |
| `address` | String | Adresse physique |
| `vocalGuidanceEnabled` | Boolean | Activer le guidage vocal pour les conducteurs |
| `strictCapacityControl` | Boolean | Bloquer l'accès si parking saturé |
| `notificationsEnabled` | Boolean | Alertes parking plein vers les agents |
| `dailyReportsEnabled` | Boolean | Envoi du rapport PDF quotidien par email |
| `twoFactorAuthEnabled` | Boolean | OTP requis pour la connexion des agents |
| `accentColor` | String? | Couleur d'accentuation de l'UI (format hex) |

---

## Relations entre tables

```
User ──────────── AccessLog        (1:N)  un usager → plusieurs scans
User ──────────── Agent            (1:1)  un compte agent → un profil agent
Agent ─────────── CardReader       (N:1)  plusieurs agents → un lecteur
Agent ─────────── Configuration    (N:1)  plusieurs agents → une config
CardReader ─────── Configuration   (N:1)  plusieurs lecteurs → une config
ParkingZone ────── Configuration   (N:1)  plusieurs zones → une config
AccessLog ──────── ParkingZone     (N:1)  plusieurs scans → une zone
Configuration ──── Tilemap         (1:1)  une config → une carte
Configuration ──── RoutingRule     (1:N)  une config → plusieurs règles
RoutingRule ─────── ParkingZone    (N:1)  fromParking / toParking
```
