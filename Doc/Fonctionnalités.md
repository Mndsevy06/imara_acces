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