# Documentation Technique et Cahier des Charges : Système de Gestion des Flux de Véhicules (Imara / ECOPO)

## 1. Présentation Générale du Projet
Ce projet consiste en la conception et la réalisation d'un système intelligent de contrôle d'accès et de guidage de véhicules pour le complexe scolaire Collège Imara et l'ECOPO. 
Le système fusionne la technologie matérielle (NFC/RFID, microcontrôleurs, LEDs) et logicielle (Application Multi-plateforme Web & Mobile) pour assurer la sécurité, gérer la capacité des parkings en temps réel, et offrir un guidage vocal et visuel aux conducteurs.

L'écosystème logiciel repose sur le framework **Capacitor**, permettant de déployer l'application à la fois sur le Web (pour les postes fixes) et en natif sur mobile (Android/iOS).

---

## 2. Architecture Matérielle et Logicielle

### A. Infrastructure Matérielle (Au Portail)
* **Lecteur d'Accès Principal** : Module RFID/NFC (ex: RC522 ou PN532) connecté à un microcontrôleur (ex: ESP32 avec connectivité Wi-Fi).
* **Signalétique Physique** : LEDs RGB haute luminosité intégrées au boîtier de lecture. 
    * **LED Verte** : Accès autorisé.
    * **LED Rouge** : Accès refusé (Badge invalide, Anti-passback déclenché, ou Parking saturé).
* **Badges Utilisateurs** : Cartes ou porte-clés NFC (ex: MiFare) disposant de blocs de mémoire permettant la lecture et l'écriture.

### B. Infrastructure Logicielle
* **Base de données** : Relationnelle (PostgreSQL) gérant les profils, les grilles de la carte, les plannings et les logs.
* **Backend API** : Serveur central (Node.js/Next.js) qui synchronise le matériel du portail et les applications mobiles en temps réel (via WebSockets ou requêtes HTTP régulières).
* **Frontend** : Application unifiée développée avec des technologies Web (React, Vue, ou HTML/JS) et encapsulée via **Capacitor** pour l'utilisation mobile native.

---

## 3. Description Détaillée des Profils et Interfaces

### Profil 1 : Administrateur (Interface Web PC / Capacitor)
L'administrateur a accès au "cerveau" du système. Bien que cette interface soit accessible via la version mobile Capacitor, elle est optimisée pour une utilisation sur grand écran (PC) en raison de la complexité de l'éditeur de carte.

**Fonctionnalités détaillées :**
1. **Gestion des Utilisateurs Réguliers** : Enregistrement des badges des professeurs, membres du personnel, et étudiants ECOPO, membre de la salle de sport, et les fideles de l'église. Assignation de chaque utilisateur à une "Zone de Parking" spécifique. 
2. **Gestion des Agents et Tours de Garde** : 
    * Création des profils pour les agents de sécurité.
    * Assignation d'un agent à un lecteur précis (ex: Portail Imara Principal ou Portail ECOPO).
    * Définition des plannings (Date, Heure de début, Heure de fin). L'agent ne peut se connecter et opérer le système que durant son tour de garde.
3. **Créateur de Carte Intelligent (Tilemap Editor)** :
    * Interface sous forme de grille quadrillée (ex: 20x20 cases).
    * Outils de dessin : Blocs (obstacles/bâtiments), Routes (zones carrossables), Parkings (destinations).
    * **Outil de Fléchage** : L'admin place des flèches (Haut, Bas, Gauche, Droite) sur les routes pour définir manuellement l'itinéraire vers chaque zone de parking.
4. **Monitoring et Statistiques** : Suivi en direct du nombre de places disponibles par zone et historique complet des scans.

### Profil 2 : Agent de Sécurité (Application Mobile Capacitor)
Le gardien utilise son smartphone professionnel. L'application est conçue comme une **Single Page Application (Interface Unique)** pour une efficacité maximale au portail : aucune navigation complexe n'est requise.

**Fonctionnalités détaillées :**
1. **Synchronisation Matérielle en Temps Réel** : 
    * Lorsqu'un véhicule scanne sa carte sur le lecteur fixe du portail, l'écran du smartphone de l'agent se met à jour instantanément.
    * Affichage d'un grand indicateur visuel (Vert ou Rouge) identique à la réaction des LEDs physiques du boîtier, accompagné du motif (ex: "Échec : Parking Plein").
2. **Gestion des Visiteurs (Écriture / Effacement NFC)** :
    * Utilisation du lecteur NFC interne du smartphone de l'agent (via le plugin Capacitor NFC).
    * **À l'entrée** : L'agent saisit la plaque d'immatriculation du visiteur, approche une carte NFC vierge du dos de son téléphone, et clique sur "Écrire". Les données temporaires et l'autorisation sont encodées sur la carte.
    * **À la sortie** : Le visiteur rend la carte. L'agent l'approche de son téléphone, clique sur "Effacer" pour la réinitialiser, et valide la sortie pour libérer la place de parking.

### Profil 3 : Client / Usager (Application Mobile Capacitor)
L'application client est extrêmement minimaliste et sécurisée. Elle a pour but de guider sans distraire.

**Fonctionnalités détaillées :**
1. **Écran d'Accueil** : Un simple message de bienvenue au lancement de l'application (ex: "Bienvenue au Collège Imara. En attente de scan...").
2. **Interface Unique de Guidage** : Une fois activée, l'application n'affiche qu'une seule page contenant la carte générée par l'admin.
3. **Mécanisme de Déclenchement (La Règle des 15 Secondes)** :
    * Le guidage ne s'affiche pas en permanence. 
    * Lorsque l'usager scanne physiquement sa carte au lecteur du portail, un compte à rebours de **15 secondes** se déclenche côté serveur.
    * Si l'usager ouvre son application dans ce laps de temps, la carte s'affiche avec son itinéraire spécifique.
    * Si l'usager n'ouvre pas l'application (ou la ferme), l'accès à la carte expire par mesure de sécurité, garantissant que l'itinéraire correspond bien au véhicule qui vient de franchir le portail.
4. **Guidage Vocal (Text-to-Speech)** : 
    * Pour prévenir les accidents (l'usager conduit à l'intérieur du campus), le système n'exige pas de regarder l'écran.
    * L'application analyse les flèches posées par l'admin sur le trajet et utilise la synthèse vocale du smartphone (plugin Capacitor Text-to-Speech) pour dicter le chemin (ex: *"Bienvenue. Avancez tout droit, puis au premier croisement, tournez à droite vers le parking Professeurs"*).

---

## 4. Logique Métier et Sécurité Globale (Algorithmes)

### A. Gestion de la Capacité (Comptage strict)
Le système maintient une variable numérique pour chaque parking (ex: `Capacite_ECOPO = 50`). 
* Un scan d'entrée valide fait `Capacite - 1`. 
* Un scan de sortie fait `Capacite + 1`.
* Si la variable atteint `0`, le système rejette automatiquement tout nouveau badge assigné à ce parking. La **LED Rouge** s'allume au portail et l'agent reçoit l'alerte sur son téléphone.

### B. Anti-Passback Régional
Pour éviter la fraude (une personne entre, puis passe son badge à travers les grilles à un ami) :
* Le système enregistre l'état de chaque badge (`STATUS = IN` ou `STATUS = OUT`).
* Un badge avec un `STATUS = IN` qui est scanné sur le lecteur d'entrée déclenchera une erreur "Anti-Passback" (LED Rouge). Il doit obligatoirement être scanné en sortie pour réinitialiser son statut.

### C. Le Moteur de Traduction Tilemap (Guidage)
Le code client ne fait pas de calcul GPS. Il analyse la matrice (le tableau) créée par l'administrateur :
1. Recherche des coordonnées de la case de départ (Portail) et d'arrivée (Parking de l'utilisateur).
2. Lecture séquentielle des cases contenant une "Flèche" reliant ces deux points.
3. Conversion en chaînes de caractères (ex: Flèche ➡️ = "Tournez à droite") qui sont ensuite envoyées au module de synthèse vocale.

### D. Routage Intelligent et Gestion de Débordement (Fallback)
Le système intègre un algorithme d'affectation dynamique basé sur des règles de priorité liées au profil de l'usager, assurant la fluidité du trafic même en cas de forte affluence.

Affectation Prioritaire : Par défaut, lorsqu'un utilisateur scanne sa carte, l'application identifie son profil et génère l'itinéraire vers sa zone d'attache principale (par exemple, les étudiants de l'ECOPO sont toujours dirigés en priorité vers le "Parking ECOPO").

Réaffectation Automatique (Délestage) : Le système est couplé au module de comptage en temps réel. Si la zone prioritaire de l'usager a atteint sa capacité maximale (zéro place disponible), l'algorithme ne bloque pas systématiquement l'accès au portail.

Parkings de Secours Configurables : Au lieu de rejeter l'usager, le système interroge la base de données pour trouver une zone de secours (parking secondaire). Ces routes de secours sont préalablement définies par l'administrateur pour chaque profil (ex : Si Parking ECOPO plein ➡️ Rediriger vers Parking Visiteurs B).

Mise à jour Dynamique du Guidage : Lors d'un débordement, le moteur de traduction Tilemap s'adapte instantanément. La carte interactive et les instructions vocales sont générées pour rediriger l'utilisateur vers cette nouvelle zone. L'usager entendra un message adapté, par exemple : "Votre parking habituel est complet. Redirection vers le parking de secours. Avancez sur 20 mètres puis tournez à gauche."

---

## 5. Gestion des Parkings dans l'Éditeur de Carte

### A. Définition des Parkings et Capacités depuis la Carte
L'administrateur ne se contente pas de dessiner des zones sur la grille. Pour chaque case ou zone de type "Parking" qu'il place sur la carte, il doit obligatoirement définir :
* **Le nom du parking** (ex: "Parking Professeurs", "Parking ECOPO", "Parking Visiteurs B").
* **La capacité maximale** : le nombre exact de véhicules autorisés à entrer pour ce parking. Cette valeur est directement liée au compteur en temps réel du système.

Ces informations sont saisies directement depuis l'interface de la carte, au moment où l'admin clique ou configure une case de type "Parking". Cela garantit une cohérence totale entre la carte visuelle et la logique de comptage du backend.

### B. Exigences de Qualité de la Carte
La carte est un élément central et critique du système. Elle doit être :
* **Puissante** : capable de représenter fidèlement la topographie réelle du site (bâtiments, routes, entrées/sorties, multiples zones de parking).
* **Facile à construire** : l'interface de l'éditeur doit être intuitive (glisser-déposer, outils clairs, prévisualisation en temps réel) afin que l'administrateur puisse la créer ou la modifier sans formation technique poussée.
* **Cohérente** : chaque élément posé sur la carte (route, obstacle, parking, flèche de guidage) doit avoir une signification fonctionnelle directe dans le moteur de guidage et de comptage.

---

## 6. Système de Configurations (Scénarios)

### A. Concept Général
L'utilisateur (administrateur) doit pouvoir créer et gérer des **Configurations**. Une configuration est un ensemble complet et indépendant regroupant tous les paramètres d'un déploiement du système :
* Les informations générales de la configuration (nom, description, établissement concerné, date de création).
* La carte (Tilemap) avec ses parkings et leurs capacités.
* Les agents enregistrés et leurs plannings.
* L'assignation des agents aux portails/lecteurs définis sur la carte.
* Les profils utilisateurs et leurs zones de parking attribuées.
* Toute autre donnée spécifique au scénario.

### B. Création et Réinitialisation
L'administrateur peut à tout moment :
* **Créer une nouvelle configuration** en partant de zéro : saisir les infos de base, dessiner une nouvelle carte, enregistrer les agents, les assigner, etc.
* **Recommencer depuis le début** sur une configuration existante, en effaçant et reconstruisant chaque composant (carte, agents, assignations) sans affecter les autres configurations.

### C. Verrouillage et Déverrouillage
Chaque configuration peut être placée dans deux états :
* **Déverrouillée** : la configuration est éditable. L'admin peut modifier la carte, les agents, les capacités, les règles de routage, etc.
* **Verrouillée** : la configuration est figée en lecture seule. Aucune modification n'est possible tant qu'elle n'est pas explicitement déverrouillée. Cela permet de protéger un scénario validé contre toute modification accidentelle.

Ce mécanisme permet de :
1. **Réaliser plusieurs tests de scénarios différents** : l'admin peut avoir une config "Test Lundi matin", une config "Test Événement Scolaire", etc., chacune verrouillée après validation pour en conserver l'état exact.
2. **Préparer une commercialisation de l'application** : lors du déploiement pour un nouvel établissement client, il suffit de créer une nouvelle configuration dédiée (ex: "Lycée Saint-Joseph"), de la paramétrer entièrement, et de la verrouiller une fois mise en production. Chaque client possède ainsi sa propre configuration isolée, sans risque d'interférence avec les autres.

---

## 7. Authentification et Gestion des Sessions

### A. Authentification selon la Plateforme
Le comportement de la connexion diffère selon la plateforme utilisée.

**Version Web (Navigateur PC)**
* Destinée exclusivement à l'administrateur.
* Formulaire classique : saisie de l'**adresse e-mail** et du **mot de passe**.

**Version Capacitor (Application Mobile)**
* À l'ouverture de l'application, l'utilisateur choisit son profil parmi deux options :
    * **Agent** : saisir son **nom** et son **code agent** (code défini lors de son enregistrement par l'administrateur).
    * **Adhérent** (usager régulier : professeur, étudiant, membre du personnel, fidèle, membre de la salle de sport, etc.) : saisir son **nom** et son **numéro de plaque d'immatriculation**.

### B. Persistance de Session (Connexion Mémorisée)
* Une fois connecté, l'application mémorise les informations de l'utilisateur localement sur son appareil.
* L'utilisateur n'est plus obligé de se reconnecter à chaque ouverture de l'application.
* La session reste active jusqu'à une déconnexion manuelle et explicite de l'utilisateur.
* Cette persistance s'applique aussi bien pour les agents que pour les adhérents sur la version mobile.

# Documentation Frontend — Système Imara / ECOPO

> **Cahier des charges UI/UX complet** — Architecture, Design System, Catalogue des écrans et règles de développement pour l'application multi-plateforme de gestion des flux de véhicules.

---

## Table des Matières

1. [Stack Technologique](#1-stack-technologique)
2. [Architecture des Fichiers](#2-architecture-des-fichiers)
3. [Centralisation de la Configuration `.env`](#3-centralisation-de-la-configuration-env)
4. [Design System](#4-design-system)
5. [Mode Sombre / Clair](#5-mode-sombre--clair)
6. [Stratégie Responsive](#6-stratégie-responsive)
7. [Performance et Démarrage Rapide](#7-performance-et-démarrage-rapide)
8. [Stratégie Visuelle — Images Pexels](#8-stratégie-visuelle--images-pexels)
9. [Catalogue Complet des Écrans](#9-catalogue-complet-des-écrans)
   - [A. Authentification](#a-authentification)
   - [B. Interface Administrateur](#b-interface-administrateur)
   - [C. Interface Agent de Sécurité](#c-interface-agent-de-sécurité)
   - [D. Interface Client / Adhérent](#d-interface-client--adhérent)
10. [Composants Transversaux](#10-composants-transversaux)

---

## 1. Stack Technologique

| Couche | Technologie | Rôle |
|---|---|---|
| Framework UI | **React 18 + TypeScript** | Composants déclaratifs, typage strict |
| Bundler | **Vite 5** | Build ultra-rapide, HMR instantané |
| Styling | **Tailwind CSS 3** | Utility-first, dark mode natif, responsive |
| Wrapper Mobile | **Capacitor 5** | Déploiement iOS / Android / Web depuis un seul code |
| Routing | **React Router v6** | Navigation SPA, lazy loading par route |
| État Global | **Zustand** | Store léger, persistance locale simple |
| Temps Réel | **Socket.io-client** | Synchronisation WebSocket portail ↔ app |
| Animations | **Framer Motion** | Transitions fluides, micro-interactions |
| Icônes | **Lucide React** | Bibliothèque SVG cohérente et légère |
| NFC Mobile | **@capacitor-community/nfc** | Lecture / écriture NFC sur smartphone agent |
| TTS Mobile | **@capacitor/text-to-speech** | Guidage vocal client |
| Formulaires | **React Hook Form + Zod** | Validation typée, performance optimale |
| Requêtes API | **TanStack Query (React Query)** | Cache, invalidation, retry automatiques |

---

## 2. Architecture des Fichiers

```
src/
├── assets/                    # Logos, icônes statiques
├── components/                # Composants réutilisables
│   ├── ui/                    # Primitives (Button, Input, Badge, Card…)
│   ├── layout/                # AppShell, Sidebar, TopBar, BottomNav
│   ├── map/                   # TilemapEditor, TilemapViewer, TileCell
│   ├── nfc/                   # NFCWriteForm, NFCEraseButton
│   └── charts/                # CapacityGauge, ScanHistoryChart
├── config/                    # Lecture centralisée des variables d'env
│   └── env.ts
├── hooks/                     # Hooks métier personnalisés
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useNfc.ts
│   └── useTTS.ts
├── screens/                   # Écrans complets par profil
│   ├── auth/
│   │   ├── AdminLoginScreen.tsx
│   │   ├── ProfileSelectScreen.tsx
│   │   ├── AgentLoginScreen.tsx
│   │   └── MemberLoginScreen.tsx
│   ├── admin/
│   │   ├── DashboardScreen.tsx
│   │   ├── ConfigListScreen.tsx
│   │   ├── ConfigEditorScreen.tsx
│   │   ├── TilemapEditorScreen.tsx
│   │   ├── UserManagementScreen.tsx
│   │   ├── AgentManagementScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── agent/
│   │   └── AgentOperationalScreen.tsx
│   └── client/
│       ├── ClientStandbyScreen.tsx
│       └── ClientGuidanceScreen.tsx
├── services/                  # Couche API + WebSocket
│   ├── api.ts                 # Instance Axios centralisée
│   ├── authService.ts
│   ├── configService.ts
│   ├── userService.ts
│   ├── parkingService.ts
│   └── socketService.ts
├── store/                     # Stores Zustand
│   ├── authStore.ts
│   ├── configStore.ts
│   ├── socketStore.ts
│   └── themeStore.ts
├── theme/                     # Tokens CSS variables
│   ├── colors.ts
│   └── typography.ts
├── types/                     # Types TypeScript globaux
│   └── index.ts
├── utils/                     # Fonctions utilitaires pures
│   ├── tilemapParser.ts
│   └── routeToSpeech.ts
├── App.tsx                    # Racine, providers globaux
├── main.tsx                   # Point d'entrée Vite
└── router.tsx                 # Définition des routes avec lazy loading
```

---

## 3. Centralisation de la Configuration `.env`

Toutes les valeurs sensibles ou configurables sont regroupées dans les fichiers `.env`. Aucune constante critique n'est codée en dur dans le code source.

### Fichiers `.env`

```
.env                    ← valeurs communes (commitées, non-secrètes)
.env.local              ← surcharges locales (ignoré par git)
.env.production         ← valeurs de production
```

### Variables définies

```dotenv
# === API & WebSocket ===
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000

# === Application ===
VITE_APP_NAME=Imara Access
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LOCALE=fr

# === Sécurité / Session ===
VITE_SESSION_TIMEOUT_HOURS=24
VITE_SCAN_WINDOW_SECONDS=15        # Fenêtre de déclenchement guidage client
VITE_ANTI_PASSBACK_ENABLED=true

# === Carte (Tilemap) ===
VITE_MAP_DEFAULT_ROWS=20
VITE_MAP_DEFAULT_COLS=20
VITE_MAP_CELL_SIZE_PX=40

# === Médias ===
VITE_PEXELS_API_KEY=your_pexels_api_key_here

# === Feature Flags ===
VITE_FEATURE_TTS_ENABLED=true
VITE_FEATURE_NFC_ENABLED=true
VITE_FEATURE_DARK_MODE_DEFAULT=true
```

### Fichier `src/config/env.ts` (lecture typée centralisée)

```typescript
export const ENV = {
  apiBaseUrl:           import.meta.env.VITE_API_BASE_URL,
  wsUrl:                import.meta.env.VITE_WS_URL,
  appName:              import.meta.env.VITE_APP_NAME,
  scanWindowSeconds:    Number(import.meta.env.VITE_SCAN_WINDOW_SECONDS),
  map: {
    defaultRows:        Number(import.meta.env.VITE_MAP_DEFAULT_ROWS),
    defaultCols:        Number(import.meta.env.VITE_MAP_DEFAULT_COLS),
    cellSizePx:         Number(import.meta.env.VITE_MAP_CELL_SIZE_PX),
  },
  pexelsApiKey:         import.meta.env.VITE_PEXELS_API_KEY,
  features: {
    tts:                import.meta.env.VITE_FEATURE_TTS_ENABLED === 'true',
    nfc:                import.meta.env.VITE_FEATURE_NFC_ENABLED === 'true',
    darkModeDefault:    import.meta.env.VITE_FEATURE_DARK_MODE_DEFAULT === 'true',
  },
} as const;
```

---

## 4. Design System

### Palette de Couleurs

Les couleurs sont définies comme variables CSS dans `:root` et `.dark`, permettant un switch instantané sans recalcul JavaScript.

```css
/* Mode Clair */
:root {
  --color-bg-primary:     #F8FAFC;   /* Blanc cassé doux */
  --color-bg-secondary:   #FFFFFF;
  --color-bg-surface:     #EFF2F7;   /* Cards, panneaux */

  --color-text-primary:   #0F172A;   /* Quasi-noir */
  --color-text-secondary: #64748B;   /* Gris ardoise */
  --color-text-muted:     #94A3B8;

  --color-accent-primary: #2563EB;   /* Bleu professionnel */
  --color-accent-hover:   #1D4ED8;

  --color-success:        #16A34A;   /* Vert accès autorisé */
  --color-success-bg:     #DCFCE7;
  --color-danger:         #DC2626;   /* Rouge accès refusé */
  --color-danger-bg:      #FEE2E2;
  --color-warning:        #D97706;   /* Ambre alertes */
  --color-warning-bg:     #FEF3C7;

  --color-border:         #E2E8F0;
  --color-shadow:         rgba(15, 23, 42, 0.08);
}

/* Mode Sombre */
.dark {
  --color-bg-primary:     #0F172A;   /* Bleu nuit profond */
  --color-bg-secondary:   #1E293B;
  --color-bg-surface:     #263244;

  --color-text-primary:   #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-muted:     #64748B;

  --color-accent-primary: #3B82F6;
  --color-accent-hover:   #60A5FA;

  --color-success:        #22C55E;
  --color-success-bg:     rgba(34, 197, 94, 0.15);
  --color-danger:         #EF4444;
  --color-danger-bg:      rgba(239, 68, 68, 0.15);
  --color-warning:        #F59E0B;
  --color-warning-bg:     rgba(245, 158, 11, 0.15);

  --color-border:         #334155;
  --color-shadow:         rgba(0, 0, 0, 0.35);
}
```

### Typographie

```
Police principale : Inter (Google Fonts)
Police monospace  : JetBrains Mono (codes agent, plaques)

Échelle :
  - xs   : 11px  (labels discrets)
  - sm   : 13px  (texte secondaire)
  - base : 15px  (corps de texte)
  - lg   : 17px  (titres de section)
  - xl   : 20px  (titres de page)
  - 2xl  : 24px  (grands titres)
  - 3xl  : 30px  (indicateurs accès agent)
  - 4xl  : 48px  (compteur vert/rouge agent)
```

### Composants Clés

| Composant | Description |
|---|---|
| `<Button>` | 5 variantes : `primary`, `secondary`, `danger`, `ghost`, `outline` ; 3 tailles |
| `<Card>` | Surface arrondie avec `glass-morphism` en mode sombre |
| `<Badge>` | Statuts : `active`, `inactive`, `locked`, `full`, `in`, `out` |
| `<StatusIndicator>` | Grand cercle vert/rouge animé (interface agent) |
| `<CapacityBar>` | Barre de progression avec couleur dynamique selon % restant |
| `<TileCell>` | Case de la tilemap avec type (route, parking, obstacle, flèche) |
| `<Modal>` | Overlay centré, fermeture clavier (Escape), trap focus |
| `<Toast>` | Notifications éphémères (succès, erreur, info) |
| `<Skeleton>` | Placeholders animés pendant le chargement |
| `<PexelsImage>` | Composant image avec fallback, lazy loading et optimisation |

---

## 5. Mode Sombre / Clair

- Le thème est stocké dans `themeStore.ts` (Zustand) **et** persisté dans `localStorage`.
- La classe `.dark` est appliquée sur `<html>` (stratégie Tailwind `class`).
- Au premier lancement, la préférence système (`prefers-color-scheme`) est détectée automatiquement.
- Un **bouton de bascule** (icône soleil / lune) est présent dans la `TopBar` sur toutes les interfaces.
- Les transitions entre modes utilisent `transition-colors duration-300` pour une bascule douce sans flash.

---

## 6. Stratégie Responsive

L'application est **mobile-first**. Chaque composant est conçu pour les petits écrans puis étendu aux grands.

```
Breakpoints Tailwind utilisés :
  sm  : 640px   → Téléphones larges
  md  : 768px   → Tablettes portrait
  lg  : 1024px  → Tablettes paysage / Laptops
  xl  : 1280px  → Grands écrans PC
  2xl : 1536px  → Écrans très larges
```

### Règles de mise en page

- **Mobile (Web Admin dans navigateur)** : TopBar avec bouton hamburger ☰ → ouvre un `Drawer` latéral gauche en overlay. Le Drawer se ferme en cliquant en dehors ou sur la croix.
- **Tablette** : Sidebar rétractable (icône chevron pour réduire/agrandir), grilles 2 colonnes.
- **Desktop** : Sidebar permanente visible. Les liens de navigation de la sidebar affichent un **sous-menu déroulant au survol (`hover`)** quand un item possède des sous-sections (ex: Configurations → [Liste, Créer]). Ce dropdown apparaît après 150ms de survol (délai anti-faux-positif) et disparaît dès que la souris quitte la zone.
- **Capacitor Agent et Client** : **Zéro navigation**. Ces deux interfaces sont des Single Page Applications sans sidebar, sans TopBar de navigation, sans hamburger. L'intégralité du contenu est sur un seul écran fixe.
- Les tableaux de données passent en mode liste `card` sur mobile et en `table` HTML sur desktop.
- Les modales font 100% de la largeur sur mobile et max `640px` centrés sur desktop.
- Les polices sont fluides : `clamp(14px, 2vw, 16px)` sur les textes de corps.

---

## 7. Performance et Démarrage Rapide

### Objectifs

| Métrique | Cible |
|---|---|
| First Contentful Paint (FCP) | < 1.0s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.0s |
| Bundle initial (gzippé) | < 150 KB |

### Techniques appliquées

1. **Code splitting par route** : `React.lazy()` + `Suspense` sur chaque écran → seul le code de l'écran actif est chargé.
2. **Preloading intelligent** : Les routes fréquemment visitées sont preloadées au survol/focus du lien de navigation.
3. **Vite builds optimisés** : `rollupOptions.manualChunks` sépare les vendors (React, Socket.io, Framer Motion).
4. **Tree shaking** : Lucide React importé par icône individuelle, jamais le bundle complet.
5. **Images lazy + WebP** : `loading="lazy"` systématique, format WebP via Pexels URL params.
6. **Service Worker (PWA)** : Cache des ressources statiques pour un chargement hors-ligne partiel et une réouverture instantanée.
7. **React Query** : Données mises en cache localement, rechargement en arrière-plan invisible pour l'utilisateur.
8. **Skeleton screens** : Affichés immédiatement, supprimant la perception de latence.
9. **Capacitor Splash Screen** : Écran de démarrage natif configuré pour masquer le temps de boot du WebView.

---

## 8. Stratégie Visuelle — Images Pexels

Chaque section de l'application utilise des photographies thématiques provenant de Pexels pour créer une identité visuelle forte et professionnelle.

| Section | Thème visuel | Mots-clés Pexels suggérés |
|---|---|---|
| Fond de login Admin (Web) | Campus / architecture moderne | `school campus architecture` |
| Fond de login Mobile | Sécurité / barrière de parking | `parking gate security` |
| Dashboard Admin | Parking vue aérienne / flux urbain | `aerial parking lot` |
| Carte de guidage (bannière) | Route de campus verdoyante | `campus road pathway` |
| Gestion utilisateurs | Personnes dans un établissement | `students campus people` |
| Gestion agents | Gardien / sécurité professionnelle | `security guard professional` |
| Historique / Statistiques | Tableau de bord / data | `data analytics dashboard` |
| Écran d'attente client | Voiture à un portail | `car entrance gate` |

Les images sont chargées via le composant `<PexelsImage>` qui :
- Construit l'URL avec les paramètres de dimensions optimisées (`?auto=compress&w=1200`)
- Applique un `blur` placeholder (couleur dominante extraite) pendant le chargement
- Affiche un fallback gradient si l'API est indisponible

---

## 9. Catalogue Complet des Écrans

---

### A. Authentification

---

#### Écran A-01 — Login Administrateur (Web)

**Route** : `/admin/login` | **Plateforme** : Web PC uniquement

**Description** : Première porte d'entrée du système pour l'administrateur. L'écran est scindé en deux colonnes : une zone visuelle immersive à gauche et un formulaire épuré à droite.

**Éléments de l'écran :**

| Zone | Élément | Description |
|---|---|---|
| **Colonne gauche (50%)** | Image Pexels | Photo plein-fond d'un campus moderne de nuit ou de jour (selon le thème). Overlay dégradé `from-accent-primary/80 to-transparent`. |
| | Citation / Tagline | Texte court en blanc : *"Contrôle d'accès intelligent. Sécurité totale."* |
| | Logo application | Logo blanc centré sur l'image |
| **Colonne droite (50%)** | Fond | `bg-primary` (blanc cassé / bleu nuit selon thème) |
| | Bascule thème | Icône soleil/lune en haut à droite |
| | Logo + Nom app | `<img>` logo couleur + titre "Imara Access" |
| | Sous-titre | "Interface Administrateur" en texte secondaire |
| | Champ Email | Input avec icône `Mail`, placeholder `admin@imara.cd`, validation Zod |
| | Champ Mot de passe | Input `type="password"` avec icône `Lock`, bouton œil pour révéler |
| | Option "Rester connecté" | Checkbox persistance de session |
| | Bouton de connexion | `<Button variant="primary" size="lg">` pleine largeur, avec spinner pendant la requête |
| | Message d'erreur | Toast rouge discret + texte sous le formulaire si identifiants incorrects |
| **Bas de page** | Version | `v{VITE_APP_VERSION}` en texte très discret |

**Comportement** : À la soumission réussie, `authStore` est hydraté, et l'utilisateur est redirigé vers `/admin/dashboard` avec animation de fondu.

---

#### Écran A-02 — Sélection de Profil (Mobile)

**Route** : `/` (ou écran initial Capacitor) | **Plateforme** : Mobile (Capacitor)

**Description** : Écran d'accueil de l'application mobile. L'utilisateur choisit son rôle avant de s'identifier. C'est la seule bifurcation de navigation côté mobile.

**Éléments de l'écran :**

| Zone | Élément | Description |
|---|---|---|
| **En-tête** | Fond dégradé | Dégradé vertical `from-accent-primary to-bg-secondary`, pleine hauteur sur mobile |
| | Logo + Nom | Logo blanc + nom de l'application centré |
| | Sous-titre | Nom de l'établissement récupéré depuis l'env ou la config active |
| | Image décorative | Photo Pexels de parking/portail en filigrane semi-transparent |
| **Corps** | Carte Agent | Carte grande `rounded-2xl shadow-xl` avec icône `ShieldCheck`, titre "Agent de Sécurité", description courte. Couleur accent bleu. |
| | Carte Adhérent | Carte grande avec icône `Car`, titre "Adhérent / Usager", description courte. Couleur accent indigo. |
| | Animation | Les deux cartes entrent avec `Framer Motion` en `fadeInUp` décalé de 100ms |
| **Pied de page** | Lien admin | Lien discret texte "Accès Administrateur" → vers `/admin/login` (ouvre le navigateur) |
| | Version | Numéro de version discret |

---

#### Écran A-03 — Login Agent (Mobile)

**Route** : `/agent/login` | **Plateforme** : Mobile (Capacitor)

**Description** : Formulaire minimaliste pour l'agent. Le design est sobre et fonctionnel.

**Éléments de l'écran :**

| Zone | Élément | Description |
|---|---|---|
| **En-tête** | Icône retour | Flèche pour revenir à A-02 |
| | Titre | "Connexion Agent" + icône `ShieldCheck` |
| | Sous-titre | "Saisissez vos identifiants d'agent" |
| **Formulaire** | Champ Nom | Input texte, placeholder "Votre nom complet", icône `User` |
| | Champ Code Agent | Input `type="password"`, placeholder "Code à 6 caractères", icône `Key`, police monospace pour le code |
| | Sélecteur Portail | Dropdown des portails disponibles pour la configuration active (récupérés depuis l'API) |
| | Bouton Connexion | Bouton pleine largeur, avec validation et spinner |
| | Message d'erreur | "Code invalide" ou "Hors de votre tour de garde" selon le cas serveur |
| **Bas** | Info tour de garde | Si login réussi mais hors plage horaire → message d'avertissement spécifique |

---

#### Écran A-04 — Login Adhérent / Membre (Mobile)

**Route** : `/member/login` | **Plateforme** : Mobile (Capacitor)

**Description** : Identification de l'usager par son nom et sa plaque d'immatriculation. Interface épurée orientée vitesse de saisie.

**Éléments de l'écran :**

| Zone | Élément | Description |
|---|---|---|
| **En-tête** | Icône retour | Flèche vers A-02 |
| | Titre | "Connexion Adhérent" + icône `Car` |
| **Formulaire** | Champ Nom | Input texte standard |
| | Champ Plaque | Input en **majuscules forcées** (`uppercase`), police monospace `JetBrains Mono`, placeholder "AA 1234 BB", validation du format |
| | Bouton Se connecter | Bouton pleine largeur |
| **Info bas de page** | Note | "Vos données sont utilisées uniquement pour le guidage au sein de l'établissement." texte discret |

---

### B. Interface Administrateur

> L'interface admin est **Web-first** (optimisée grand écran) mais accessible sur mobile via Capacitor. Elle utilise un layout `<AdminShell>` dont le comportement de navigation s'adapte strictement à la plateforme.

---

#### Composant Shell Admin — `<AdminShell>`

Présent sur tous les écrans admin. Wraps la page dans un layout complet avec navigation contextuelle.

---

##### Navigation Desktop (≥ 1024px)

**Sidebar permanente (gauche, largeur fixe 240px) :**

| Élément | Description |
|---|---|
| Logo + Nom app | En haut, avec lien vers `/admin/dashboard` |
| Sélecteur de Configuration | Dropdown compact indiquant la config active + badge `VERROUILLÉE` / `ÉDITABLE` |
| **Liens de navigation** | Liste verticale d'items cliquables (voir tableau ci-dessous) |
| Statut système | Pastille animée verte "En direct" ou rouge "Déconnecté" |
| Avatar Admin | Initiales ou photo + nom en bas |
| Bouton Déconnexion | Icône `LogOut`, lien texte discret en bas |

**Liens de navigation avec sous-menus au survol :**

| Item | Icône | Sous-menu (hover dropdown) |
|---|---|---|
| Tableau de Bord | `LayoutDashboard` | — (navigation directe) |
| Configurations | `Settings2` | → Liste des configs / → Nouvelle configuration |
| Carte | `Map` | → Éditeur de carte (config active) |
| Utilisateurs | `Users` | → Liste / → Ajouter un utilisateur |
| Agents | `ShieldCheck` | → Liste des agents / → Plannings |
| Historique | `ClipboardList` | → Scans / → Statistiques |
| Paramètres | `SlidersHorizontal` | — (navigation directe) |

**Comportement du dropdown au survol :**
- Le sous-menu apparaît après **150ms** de survol de l'item parent (délai anti-faux-positif).
- Il se positionne à droite de la sidebar, aligné sur le haut de l'item.
- Il disparaît immédiatement si la souris quitte la zone combinée item + dropdown.
- Animation : `fadeIn + translateX(4px)` en `100ms` via Framer Motion.
- L'item actif est mis en surbrillance (`bg-accent-primary/10` + bordure gauche colorée).

---

##### Navigation Tablette (768px – 1023px)

**Sidebar rétractable (icône chevron) :**

| État | Comportement |
|---|---|
| Étendue (240px) | Texte + icônes visibles, sous-menus au survol actifs |
| Réduite (60px) | Seulement les icônes. Au survol d'une icône : **tooltip + dropdown** apparaissent à droite |

---

##### Navigation Mobile (< 768px) — Web Admin dans navigateur

**TopBar fixe en haut :**

| Élément | Description |
|---|---|
| Bouton Hamburger ☰ | À gauche. Icône `Menu` (Lucide). Au clic, ouvre le Drawer |
| Titre de la page courante | Centré, mis à jour dynamiquement à chaque changement de route |
| Bascule thème | À droite (icône soleil/lune) |

**Drawer latéral (gauche) :**

| Comportement | Description |
|---|---|
| Ouverture | Glisse depuis la gauche (`translateX(-100%)` → `0`) en `300ms` ease-out |
| Fermeture | Clic sur la croix ✕ en haut à droite du Drawer, **ou** clic sur l'overlay sombre derrière |
| Overlay | Fond semi-transparent `bg-black/40` couvrant le reste de l'écran, cliquable pour fermer |
| Contenu | Identique à la Sidebar desktop (logo, navigation, statut, avatar, déconnexion) |
| Sous-menus | Sur mobile, les items avec sous-menu s'**expandent verticalement** au clic (accordéon), pas au survol |
| Animation hamburger | L'icône `Menu` se transforme en `X` lors de l'ouverture (`rotate + morph` via Framer Motion) |

---

##### Navigation Capacitor Agent & Client — AUCUNE

> **Règle absolue** : Les interfaces Agent (`AgentOperationalScreen`) et Client (`ClientStandbyScreen`, `ClientGuidanceScreen`) sont des **Single Page Applications sans aucune navigation**.
>
> - Pas de sidebar.
> - Pas de hamburger.
> - Pas de TopBar de navigation.
> - Pas de liens vers d'autres écrans.
>
> La seule action de sortie disponible est un bouton **"Fin de service"** (Agent) ou **"Se déconnecter"** (Client), placé discrètement et demandant une confirmation avant de ramener à l'écran de sélection de profil (A-02).

---

#### Écran B-01 — Tableau de Bord Principal (Dashboard)

**Route** : `/admin/dashboard` | **Plateforme** : Web + Mobile

**Description** : Vue synthétique en temps réel du statut global du système. C'est l'écran consulté le plus fréquemment en période d'activité.

**Bannière supérieure :**

| Élément | Description |
|---|---|
| Image Pexels (hero) | Vue aérienne d'un parking, en fond de bandeau avec overlay. Hauteur 200px sur desktop. |
| Titre | "Tableau de Bord — {Nom de la Configuration active}" |
| Date et heure | Temps réel (mis à jour toutes les secondes) |
| Statut WebSocket | Indicateur "En direct" vert animé ou "Reconnexion..." orange |

**Grille de Statistiques Instantanées (KPI Cards) :**

4 cartes en grille (2×2 sur mobile, 4×1 sur desktop) :

| Carte | Icône | Données affichées |
|---|---|---|
| Total Véhicules présents | `Car` | Nombre total de véhicules actuellement `STATUS = IN` |
| Places disponibles (global) | `ParkingSquare` | Somme des capacités restantes sur tous les parkings |
| Scans du jour | `ScanBarcode` | Nombre de scans (entrées + sorties) depuis minuit |
| Agents actifs | `ShieldCheck` | Nombre d'agents actuellement dans leur tour de garde |

**Section Capacité par Parking :**

Pour chaque parking défini sur la carte :

| Élément | Description |
|---|---|
| Nom du parking | Titre de la carte |
| `<CapacityBar>` | Barre de progression : verte (> 40%), orange (10–40%), rouge (< 10% ou 0) |
| Compteur | "X / Y places disponibles" |
| Badge | `PLEIN` en rouge clignotant si capacité = 0 |

**Flux de Scans en Temps Réel :**

| Élément | Description |
|---|---|
| Liste des 10 derniers scans | Ligne : avatar initiales + nom + badge (ENTRÉE / SORTIE) + parking + heure + résultat (✅ / ❌ + motif) |
| Mise à jour | Via WebSocket : nouvelle ligne insérée en haut avec animation `slideDown` |

**Graphique Historique du Jour :**

| Élément | Description |
|---|---|
| `<ScanHistoryChart>` | Histogramme (via Recharts ou Chart.js) affichant le volume de scans par heure |
| Légende | Entrées en bleu, Sorties en violet, Refus en rouge |

---

#### Écran B-02 — Liste des Configurations

**Route** : `/admin/configurations` | **Plateforme** : Web + Mobile

**Description** : Gestion des scénarios de déploiement. Chaque configuration est une instance indépendante du système.

**En-tête de page :**

| Élément | Description |
|---|---|
| Titre | "Configurations" |
| Bouton "Nouvelle Configuration" | `<Button variant="primary">` + icône `Plus` |

**Grille de Configurations :**

Chaque configuration est affichée comme une `<Card>` contenant :

| Élément | Description |
|---|---|
| Nom de la configuration | Titre en gras |
| Description | Texte secondaire court |
| Établissement | Icône `Building2` + nom |
| Date de création | Icône `Calendar` + date formatée |
| Badge d'état | `VERROUILLÉE` (icône `Lock`, fond orange) ou `ÉDITABLE` (icône `Unlock`, fond vert) |
| Nombre d'agents | Icône `Users` + chiffre |
| Nombre de parkings | Icône `ParkingSquare` + chiffre |
| Actions | Bouton "Activer" (étoile), "Éditer" (crayon, désactivé si verrouillée), "Verrouiller/Déverrouiller" (cadenas), "Supprimer" (poubelle, avec confirmation modal) |

**Indicateur de configuration active :**

Un bandeau bleu discret en haut de la liste indique quelle configuration est actuellement en cours d'utilisation par le système matériel.

---

#### Écran B-03 — Création / Édition d'une Configuration

**Route** : `/admin/configurations/new` et `/admin/configurations/:id/edit` | **Plateforme** : Web + Mobile

**Description** : Formulaire structuré en plusieurs sections pour définir tous les paramètres d'un scénario.

**Navigation par onglets (Stepper horizontal sur desktop / accordéon sur mobile) :**

| Onglet | Contenu |
|---|---|
| **1. Informations générales** | Nom (requis), description, nom de l'établissement, adresse, dates de validité |
| **2. Carte** | Aperçu miniature de la tilemap + bouton "Ouvrir l'éditeur de carte" (→ B-04) + résumé des parkings définis |
| **3. Agents** | Liste des agents assignés à cette config + planning résumé |
| **4. Utilisateurs** | Compteur d'utilisateurs assignés + lien vers la gestion |
| **5. Règles de Routage** | Définition des parkings de secours pour chaque profil d'usager (ex: Si parking X plein → rediriger vers Y) |

**Pied de formulaire :**

| Élément | Description |
|---|---|
| Bouton "Enregistrer le brouillon" | Sauvegarde sans activer |
| Bouton "Enregistrer et activer" | Sauvegarde et définit comme configuration courante |
| Bouton "Annuler" | Retour à B-02 avec confirmation si des changements sont non-sauvegardés |

---

#### Écran B-04 — Éditeur de Carte (Tilemap Editor)

**Route** : `/admin/configurations/:id/map` | **Plateforme** : Web (optimisé grand écran), accessible Mobile

**Description** : Cœur visuel de l'interface admin. L'administrateur dessine la topographie réelle du site sur une grille interactive. C'est l'écran le plus complexe de l'application.

**Layout général :**

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR : Titre | Grille dimensions | Undo | Redo | Save │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  PANNEAU     │         GRILLE TILEMAP                   │
│  OUTILS      │         (20×20 par défaut, zoomable)     │
│  (LEFT)      │                                          │
│              │                                          │
│  - Blocs     │                                          │
│  - Routes    │                                          │
│  - Parkings  │                                          │
│  - Flèches   │                                          │
│  - Portail   │                                          │
│  - Effacer   │                                          │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  PANNEAU BAS : Propriétés de la case sélectionnée       │
└─────────────────────────────────────────────────────────┘
```

**Panneau Outils (gauche) :**

| Outil | Icône | Type de case | Couleur sur grille |
|---|---|---|---|
| **Bloc / Bâtiment** | `Building2` | Obstacle infranchissable | Gris foncé avec hachures |
| **Route** | `RouteIcon` | Zone carrossable | Gris clair / beige |
| **Parking** | `ParkingSquare` | Destination (cliquable) | Bleu pâle |
| **Portail / Entrée** | `DoorOpen` | Point de départ du guidage | Vert clair |
| **Flèche →** | `ArrowRight` | Direction guidage Droite | Icône sur fond route |
| **Flèche ←** | `ArrowLeft` | Direction guidage Gauche | Icône sur fond route |
| **Flèche ↑** | `ArrowUp` | Direction guidage Haut | Icône sur fond route |
| **Flèche ↓** | `ArrowDown` | Direction guidage Bas | Icône sur fond route |
| **Gomme** | `Eraser` | Efface la case | — |
| **Seau (remplissage)** | `PaintBucket` | Remplissage de zone (flood fill) | — |

**Grille Tilemap :**

| Élément | Description |
|---|---|
| Grille SVG ou Canvas | `VITE_MAP_DEFAULT_COLS × VITE_MAP_DEFAULT_ROWS` cases, chacune de `VITE_MAP_CELL_SIZE_PX` |
| Lignes de grille | Fines lignes grises pour la lisibilité |
| Case survolée | Highlight au hover selon l'outil actif |
| Zoom | Molette souris (desktop) / Pinch (mobile) + boutons +/- |
| Déplacement (pan) | Clic droit maintenu (desktop) / deux doigts (mobile) |
| Dessin | Clic ou glisser pour dessiner en continu |

**Panneau Propriétés (bas, contextuel) :**

Apparaît quand une case de type **Parking** est sélectionnée :

| Élément | Description |
|---|---|
| Champ "Nom du parking" | Input texte, ex: "Parking Professeurs" |
| Champ "Capacité maximale" | Input numérique, requis |
| Champ "Profils autorisés" | Multi-select : Professeurs, Étudiants, Personnel, Fidèles, Gym, Visiteurs |
| Champ "Parking de secours" | Dropdown des autres parkings définis sur la carte |
| Bouton "Appliquer" | Met à jour la case et sauvegarde les métadonnées |

**Barre d'outils supérieure :**

| Élément | Description |
|---|---|
| Dimensions | Inputs W × H pour redimensionner la grille (avec confirmation) |
| Undo / Redo | Historique des actions (max 50 étapes), raccourcis `Ctrl+Z` / `Ctrl+Y` |
| Prévisualisation | Bouton pour ouvrir la carte en mode lecture seule (comme un client la verrait) |
| Sauvegarde | Bouton "Enregistrer la carte" avec indicateur de sauvegarde automatique toutes les 30s |
| Exporter | Export PNG de la carte pour documentation |

---

#### Écran B-05 — Gestion des Utilisateurs

**Route** : `/admin/users` | **Plateforme** : Web + Mobile

**Description** : Enregistrement et gestion de tous les usagers réguliers du système (professeurs, personnel, étudiants, membres salle de sport, fidèles).

**En-tête :**

| Élément | Description |
|---|---|
| Image Pexels (bandeau) | Photo d'un groupe de personnes dans un campus |
| Titre | "Gestion des Utilisateurs" |
| Barre de recherche | Recherche instantanée par nom, plaque, ou profil |
| Filtres | Dropdown de profil (Professeur / Étudiant / Personnel / Fidèle / Gym) + Dropdown de parking assigné + Filtre Statut (IN / OUT / Inconnu) |
| Bouton "Ajouter un utilisateur" | Modal d'ajout |

**Tableau des Utilisateurs (desktop) / Liste de cartes (mobile) :**

| Colonne | Description |
|---|---|
| Avatar | Initiales en cercle coloré selon le profil |
| Nom complet | Texte principal |
| Profil | Badge coloré (Professeur en bleu, Étudiant en violet, etc.) |
| Plaque d'immatriculation | Police monospace |
| Parking assigné | Nom du parking + barre mini de capacité |
| Statut actuel | Badge `IN` vert ou `OUT` gris |
| N° Badge NFC | Code tronqué avec icône de copie |
| Dernière activité | Date + heure du dernier scan |
| Actions | Icônes : Modifier, Voir l'historique, Désactiver/Activer, Supprimer |

**Modal d'Ajout / Modification :**

| Champ | Description |
|---|---|
| Nom complet | Input texte |
| Profil | Select (Professeur, Étudiant ECOPO, Personnel, Fidèle Église, Membre Gym, Autre) |
| Plaque d'immatriculation | Input en majuscules |
| Parking principal assigné | Select parmi les parkings de la configuration active |
| N° UID badge NFC | Input manual ou bouton "Scanner le badge" (si appareil NFC disponible) |
| Statut du compte | Toggle Actif / Inactif |

---

#### Écran B-06 — Gestion des Agents et Plannings

**Route** : `/admin/agents` | **Plateforme** : Web + Mobile

**Description** : Création des profils agents et définition de leurs tours de garde.

**En-tête :**

| Élément | Description |
|---|---|
| Image Pexels (bandeau) | Photo d'un agent de sécurité professionnel |
| Titre | "Gestion des Agents" |
| Bouton "Nouvel Agent" | — |

**Tableau des Agents :**

| Colonne | Description |
|---|---|
| Avatar | Initiales avec couleur aléatoire déterministe |
| Nom de l'agent | Texte principal |
| Code Agent | Police monospace, masqué par défaut, bouton œil |
| Portail assigné | Badge avec nom du portail |
| Statut actuel | `EN SERVICE` (vert) / `HORS SERVICE` (gris) calculé en temps réel selon le planning |
| Prochain tour | Date + heure du prochain créneau |
| Actions | Modifier, Voir planning, Réinitialiser code, Désactiver |

**Section Planning (expanded par agent) :**

Vue calendrier ou liste des créneaux :

| Élément | Description |
|---|---|
| Calendrier hebdomadaire | Grille 7 jours × 24 heures, créneaux cliquables |
| Bouton "Ajouter un créneau" | Modal : Date, Heure début, Heure fin, Portail |
| Créneaux affichés | Blocs colorés avec nom de l'agent, cliquables pour édition |
| Chevauchements | Détectés automatiquement avec alerte visuelle |

---

#### Écran B-07 — Historique des Scans et Statistiques

**Route** : `/admin/history` | **Plateforme** : Web + Mobile

**Description** : Consultation de l'historique complet des passages et analyse statistique.

**Filtres en haut :**

| Filtre | Type |
|---|---|
| Plage de dates | DateRangePicker |
| Parking | Select multiple |
| Type d'événement | Entrée / Sortie / Refus Anti-Passback / Refus Plein / Refus Badge invalide |
| Utilisateur / Visiteur | Input de recherche |

**Graphiques :**

| Graphique | Description |
|---|---|
| Volume quotidien (7 derniers jours) | LineChart : entrées, sorties, refus |
| Répartition par parking | PieChart / DonutChart |
| Heures de pointe | Heatmap 7j × 24h |

**Tableau d'Historique :**

| Colonne | Description |
|---|---|
| Horodatage | Date + Heure précise |
| Utilisateur | Nom + badge profil ou "Visiteur" |
| Plaque | Monospace |
| Type | Badge ENTRÉE / SORTIE |
| Parking | Nom |
| Résultat | ✅ Autorisé / ❌ Refusé (+ motif en tooltip) |
| Agent | Nom de l'agent en service |

**Export :**

| Élément | Description |
|---|---|
| Bouton "Exporter CSV" | Téléchargement du tableau filtré en `.csv` |
| Bouton "Exporter PDF" | Rapport formaté avec graphiques |

---

#### Écran B-08 — Paramètres du Système

**Route** : `/admin/settings` | **Plateforme** : Web + Mobile

**Description** : Réglages généraux de l'application.

**Sections :**

| Section | Paramètres |
|---|---|
| **Profil Admin** | Modifier email, modifier mot de passe (avec confirmation) |
| **Apparence** | Bascule Thème clair/sombre, choix de la couleur accent |
| **Notifications** | Alerte quand parking plein (toggle), Alerte Anti-Passback (toggle), son de notification |
| **Système** | Version de l'API (lecture seule), statut de la connexion WebSocket, URL de l'API (modifiable), bouton "Tester la connexion" |
| **Données** | Bouton "Vider l'historique des scans" (avec confirmation et double saisie de mot de passe), bouton "Réinitialiser les compteurs" |

---

#### Écran B-09 — Gestion des Présences en Temps Réel

**Route** : `/admin/presences` | **Plateforme** : Web + Mobile

**Description** : Vue opérationnelle centrée sur les véhicules **actuellement présents** dans l'enceinte. L'administrateur voit en un coup d'œil qui est sur place, dans quel parking, depuis combien de temps, et peut déclencher des opérations manuelles sur chaque présence. Toutes les données sont alimentées en temps réel via WebSocket.

---

**En-tête de page :**

| Élément | Description |
|---|---|
| Image Pexels (bandeau fin) | Vue d'un parking occupé, avec overlay. Hauteur 120px. |
| Titre | "Présences en Temps Réel" |
| Compteur global | Badge animé : "**X véhicules présents**" mis à jour en direct |
| Indicateur WebSocket | Pastille verte "En direct" pulsante ou orange "Reconnexion…" |
| Barre de recherche | Recherche instantanée par nom, plaque d'immatriculation ou parking |
| Filtres rapides | Tabs ou pills : **Tous** / **Par parking** (un tab par parking actif) / **Visiteurs** / **Longue durée** |

---

**Tableau des Présences (desktop) / Liste de cartes (mobile) :**

Chaque ligne représente un véhicule dont le `STATUS = IN`. La liste est triée par défaut sur l'heure d'entrée (le plus récent en haut) et se met à jour en temps réel (nouvelle ligne insérée en haut avec animation `slideDown`, ligne supprimée avec `fadeOut` lors d'une sortie).

| Colonne | Description |
|---|---|
| Avatar | Initiales dans un cercle coloré selon le profil (Professeur, Étudiant, Visiteur…) |
| Nom complet | Texte principal. "Visiteur" en italique si pas de compte |
| Profil | Badge coloré |
| Plaque d'immatriculation | Police monospace `JetBrains Mono` |
| Parking | Nom du parking avec mini-badge de capacité restante |
| Heure d'entrée | Heure précise + durée écoulée en temps réel : ex. "09h14 — il y a **2h 31min**" |
| Durée | Chronomètre live (`HH:MM:SS`) avec fond orange si > seuil configurable (ex. > 4h) |
| Agent ayant validé | Nom de l'agent qui a traité l'entrée |
| Actions | Voir ci-dessous |

---

**Colonne Actions — Opérations disponibles par présence :**

Chaque ligne dispose d'un menu d'actions (bouton `•••` ou ligne d'icônes sur desktop) :

| Opération | Icône | Description |
|---|---|---|
| **Forcer la sortie** | `LogOut` | Enregistre manuellement une sortie pour ce véhicule (`STATUS → OUT`, compteur parking `+1`). Demande confirmation : *"Forcer la sortie de [NOM] — [PLAQUE] ?"*. Utile si le véhicule est sorti sans scanner (badge oublié, panne). |
| **Changer de parking** | `ArrowRightLeft` | Réassigne manuellement le véhicule vers un autre parking (dropdown des parkings avec places disponibles). Ajuste les compteurs des deux parkings en temps réel. |
| **Réinitialiser l'Anti-Passback** | `RefreshCw` | Remet le badge de cet utilisateur en `STATUS = OUT` sans comptabiliser de sortie. Utilisé quand l'Anti-Passback a été déclenché par erreur. |
| **Prolonger / Signaler** | `Flag` | Ajoute une note manuelle à la présence (ex. "Véhicule en panne", "Autorisation prolongée"). La note est visible dans l'historique. |
| **Voir le profil** | `UserSearch` | Ouvre le panneau latéral de détail de l'utilisateur (historique des dernières présences, badge NFC, parking habituel). |

---

**Panneau Résumé par Parking (en bas ou colonne droite sur desktop) :**

Cartes côte à côte (une par parking actif), mises à jour en temps réel :

| Élément | Description |
|---|---|
| Nom du parking | Titre de la carte |
| `<CapacityBar>` | Barre de progression colorée (vert / orange / rouge selon % occupé) |
| Compteur | "X véhicules présents / Y capacité totale" |
| Bouton "Voir les présences" | Filtre le tableau principal sur ce parking uniquement |
| Bouton "Vider le parking" | Opération de masse : force la sortie de **tous** les véhicules de ce parking (avec confirmation modale renforcée et double saisie). Utile en fin de journée ou cas d'urgence. |

---

**Opérations de Masse (barre d'actions groupées) :**

Apparaît quand au moins une ligne du tableau est cochée (checkbox) :

| Opération | Description |
|---|---|
| **Forcer la sortie (sélection)** | Force la sortie de tous les véhicules cochés en une seule action. Confirmation obligatoire avec récapitulatif de la liste. |
| **Réinitialiser Anti-Passback (sélection)** | Réinitialise le statut badge de tous les éléments sélectionnés. |
| **Exporter la sélection** | Exporte les présences cochées en CSV. |

---

### C. Interface Agent de Sécurité

---

#### Écran C-01 — Tableau de Bord Opérationnel Agent (SPA)

**Route** : `/agent/dashboard` | **Plateforme** : Mobile (Capacitor) — **Single Page Application**

**Description** : L'écran le plus critique de l'application. Conçu pour être lisible d'un coup d'œil, même en plein soleil, depuis une distance de 50 cm. Il n'y a **aucune navigation** : tout est sur un seul écran.

**Layout (3 zones verticales) :**

```
┌─────────────────────────────────┐
│  ZONE 1 : INDICATEUR PRINCIPAL  │  ~40% de l'écran
│  Grand cercle Vert ou Rouge     │
│  + Statut textuel               │
├─────────────────────────────────┤
│  ZONE 2 : INFO VÉHICULE SCANNÉ  │  ~25% de l'écran
│  Nom, Profil, Parking, Plaque   │
├─────────────────────────────────┤
│  ZONE 3 : GESTION VISITEURS     │  ~35% de l'écran
│  Tabs : [Écrire NFC] [Effacer]  │
└─────────────────────────────────┘
```

**Zone 1 — Indicateur Principal :**

| État | Visuel | Description |
|---|---|---|
| En attente | Cercle bleu pulsant `animate-pulse` | "En attente de scan…" |
| Accès autorisé | Grand cercle vert `bg-success` animé (flash + scale) | "ACCÈS AUTORISÉ" en police 3xl |
| Refus — Parking plein | Grand cercle rouge | "ACCÈS REFUSÉ — Parking Plein" |
| Refus — Anti-Passback | Grand cercle rouge | "ACCÈS REFUSÉ — Anti-Passback" |
| Refus — Badge invalide | Grand cercle rouge | "ACCÈS REFUSÉ — Badge Inconnu" |
| Refus — Hors horaire | Grand cercle rouge | "ACCÈS REFUSÉ — Hors Horaires" |

L'état retourne automatiquement à "En attente" après **5 secondes** (ou durée configurable).

**Zone 2 — Informations du Véhicule Scanné :**

| Élément | Description |
|---|---|
| Nom de l'usager | Police xl, gras |
| Badge de Profil | Étudiant / Professeur / Personnel / Visiteur |
| Plaque d'immatriculation | Police monospace lg |
| Parking de destination | Avec badge de capacité restante |
| Heure du scan | Horodatage précis |
| Statut du Badge | `ENTRÉ` (vert) ou `SORTI` (bleu) après la transaction |

**Zone 3 — Gestion Visiteurs :**

**Onglet "Écrire NFC" :**

| Élément | Description |
|---|---|
| Champ Plaque | Input monospace majuscules |
| Champ Nom Visiteur | Input texte (optionnel) |
| Select Parking | Dropdown des parkings disponibles |
| Bouton "Écrire sur la carte NFC" | Lance la session NFC du téléphone, animation d'attente (icône NFC animée "approchez la carte"), confirmation de succès/échec |

**Onglet "Effacer NFC" :**

| Élément | Description |
|---|---|
| Instruction | "Approchez la carte visiteur du dos du téléphone" |
| Bouton "Lire et effacer" | Lance la session NFC, lit les données (affiche le nom/plaque du visiteur), puis propose confirmation avant effacement |
| Confirmation | Modal : "Effacer la carte de [NOM] — [PLAQUE] ?" avec bouton Confirmer rouge |
| Libération de place | Automatique côté serveur après confirmation d'effacement |

**En-tête de l'écran :**

| Élément | Description |
|---|---|
| Nom de l'agent | "Agent : [Nom]" à gauche |
| Portail en service | Badge du portail assigné |
| Heure en direct | Clock en temps réel à droite |
| Bouton "Fin de service" | Icône `LogOut` discret, demande confirmation |

---

### D. Interface Client / Adhérent

---

#### Écran D-01 — Écran d'Attente (Standby)

**Route** : `/client/standby` | **Plateforme** : Mobile (Capacitor)

**Description** : Écran affiché dès que le membre est connecté mais n'a pas encore scanné sa carte. Écran minimal, non-distrayant.

**Éléments :**

| Zone | Élément | Description |
|---|---|---|
| **Fond** | Image Pexels | Photo floue (blur CSS) d'une voiture à un portail de campus. Overlay semi-transparent. |
| **Centre** | Logo + Nom app | Blancs sur fond semi-transparent |
| | Message d'accueil | "Bienvenue, [Prénom]." en grand |
| | Instruction | "Scannez votre badge au portail pour afficher votre itinéraire." en texte secondaire |
| | Animation | Icône `ScanLine` animée en pulsation douce |
| | Sous-texte discret | "Le guidage s'affiche automatiquement dans les {VITE_SCAN_WINDOW_SECONDS} secondes suivant votre scan." |
| **Bas** | Plaque d'immatriculation | Affichée en monospace discret : confirmation de l'identité active |
| | Bouton "Se déconnecter" | Texte link très discret |

**Comportement** : L'écran écoute en permanence le WebSocket. Dès que le serveur envoie un événement `scan:authorized` pour cet utilisateur, une transition automatique s'effectue vers D-02.

---

#### Écran D-02 — Carte de Guidage Interactive

**Route** : `/client/guidance` | **Plateforme** : Mobile (Capacitor)

**Description** : L'écran final du parcours client. Déclenché automatiquement après scan valide dans la fenêtre de 15 secondes. Il affiche la carte et démarre le guidage vocal immédiatement.

**Éléments :**

| Zone | Élément | Description |
|---|---|---|
| **En-tête** | Nom du parking de destination | Police xl, centré, fond `accent-primary` |
| | Compte à rebours (optionnel) | Peut afficher le temps restant avant expiration du guidage |
| **Corps — Carte** | `<TilemapViewer>` | Rendu de la tilemap complète avec : case Portail surlignée en vert (départ), chemin balisé en couleur (flèches colorées), case Parking surlignée en bleu (arrivée), cases non-pertinentes atténuées (`opacity-40`) |
| | Indicateur de position | Icône de voiture animée (optionnelle) sur la case de départ |
| | Légende | Petite légende : Route, Bâtiment, Parking |
| **Guidage Vocal** | Bannière instruction courante | La prochaine instruction TTS affichée en texte : ex. "Avancez tout droit" + icône de la flèche correspondante |
| | Bouton "Réécouter" | Icône `Volume2` pour rejouer le guidage vocal depuis le début |
| | Bouton "Muet" | Toggle pour désactiver la voix sans fermer l'écran |
| **Bas** | Message si fallback | Si redirigé vers un parking de secours, bandeau orange : "Votre parking habituel est plein. Vous êtes redirigé vers {nom_parking_secours}." |
| | Bouton "Fermer" | Retour vers D-01, avec confirmation "Le guidage sera terminé." |

**Comportement TTS :**
- Au chargement de l'écran, la synthèse vocale est automatiquement démarrée.
- Le message est composé dynamiquement en lisant les flèches du trajet : ex. *"Bienvenue au Collège Imara. Avancez tout droit sur 3 cases, puis tournez à droite vers le Parking Professeurs."*
- Si `VITE_FEATURE_TTS_ENABLED=false`, seul l'affichage textuel est actif.

---

## 10. Composants Transversaux

Ces composants sont présents sur plusieurs écrans et leur comportement est uniforme.

### `<AppLoader>`

Écran de chargement affiché pendant l'initialisation de l'app (hydratation des stores, vérification de session).

| Élément | Description |
|---|---|
| Fond | `bg-bg-primary` |
| Logo | Logo centré avec animation `fadeIn` |
| Spinner | Cercle animé sous le logo |
| Texte | "Chargement…" discret |

### `<OfflineBanner>`

Bandeau fixe en bas de l'écran quand la connexion réseau/WebSocket est perdue.

| Élément | Description |
|---|---|
| Fond | `bg-warning` (ambre) |
| Texte | "Mode hors ligne — Reconnexion en cours…" |
| Icône | `WifiOff` animé |

### `<ConfirmModal>`

Modal de confirmation pour toutes les actions destructives.

| Élément | Description |
|---|---|
| Titre | Ex: "Supprimer cette configuration ?" |
| Description | Conséquence de l'action |
| Bouton Confirmer | `<Button variant="danger">` |
| Bouton Annuler | `<Button variant="ghost">` |

### `<ToastProvider>`

Système de notifications éphémères (3s) positionné en haut à droite (desktop) ou haut centré (mobile).

| Type | Couleur | Icône |
|---|---|---|
| `success` | Vert | `CheckCircle2` |
| `error` | Rouge | `XCircle` |
| `warning` | Ambre | `AlertTriangle` |
| `info` | Bleu | `Info` |

### `<EmptyState>`

Affiché quand une liste est vide (ex: aucun agent, aucun utilisateur).

| Élément | Description |
|---|---|
| Illustration SVG | Illustration minimaliste thématique |
| Titre | "Aucun {élément} trouvé" |
| Description | Texte d'aide contextuel |
| Action | Bouton pour créer le premier élément |

---

*Documentation Frontend — Système Imara / ECOPO — v1.0 — Rédigée le 24 avril 2026*
