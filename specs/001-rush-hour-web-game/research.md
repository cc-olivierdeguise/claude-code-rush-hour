# Phase 0 — Recherche : Jeu Rush Hour sur le web

**Feature**: `001-rush-hour-web-game` | **Date**: 2026-10-01

Contrainte de l'utilisateur pour ce plan : **HTML et JavaScript uniquement, aucune base
de données**, page **responsive**, utilisable **comme application mobile et comme
application web**. Ces choix sont alignés avec la section *Platform* de la constitution.

---

## R1 — Pile technique

- **Decision**: HTML5 + CSS3 + JavaScript natif (modules ES), sans framework ni étape de
  build. Fichiers statiques servis tels quels.
- **Rationale**: demande explicite de l'utilisateur ; imposé par la constitution
  (Technical Constraints › Platform) ; le jeu tient en quelques centaines de lignes.
- **Alternatives considered**: React/Vue/Svelte (framework + build, injustifié selon le
  principe IV) ; TypeScript (nécessite un transpileur) — on utilise à la place des
  commentaires JSDoc pour documenter les types sans build.

## R2 — « Mobile app et web app » sans framework : Progressive Web App

- **Decision**: faire de la page une **PWA** minimale :
  - `manifest.webmanifest` (`display: "standalone"`, `orientation: "any"`, nom, couleurs,
    icônes 192/512 px PNG + icône maskable) ;
  - `sw.js` : service worker « cache d'abord » qui pré-cache la liste fixe des fichiers
    statiques, avec un nom de cache versionné (`rush-hour-v1`) supprimant les anciens
    caches à l'activation ;
  - balises iOS : `apple-touch-icon` (180 px), `apple-mobile-web-app-capable`,
    `theme-color`.
- **Rationale**: une PWA s'installe sur l'écran d'accueil (Android, iOS, ordinateur),
  s'ouvre en plein écran sans barre d'adresse et fonctionne hors ligne, ce qui satisfait
  l'hypothèse « fonctionne sans réseau une fois chargé » — le tout avec deux petits
  fichiers en JS/JSON natifs, sans dépendance.
- **Alternatives considered**: Capacitor/Cordova (emballage natif, outillage lourd,
  hors du périmètre « HTML + JS ») ; simple page web sans manifest (pas d'installation,
  pas de garantie hors ligne).
- **Note**: le service worker n'est enregistré que sur `https:` ou `localhost` ; en
  `file://` le jeu reste jouable mais sans installation ni cache (la constitution exige
  déjà un serveur statique pour lancer le jeu).

## R3 — Rendu du plateau responsive

- **Decision**: rendu **DOM + CSS** (pas de `<canvas>`).
  - Le plateau est un conteneur carré (`aspect-ratio: 1`) dont la taille vaut
    `min(94vw, 100dvh − hauteur des contrôles)` ; en paysage, les contrôles passent à
    côté du plateau (media query `orientation: landscape`).
  - Chaque véhicule est un `<button>` positionné en absolu, avec des variables CSS
    (`--row`, `--col`, `--len`) converties en pourcentages du plateau ; il n'y a donc
    aucun calcul en pixels à refaire au redimensionnement ou à la rotation (cas limite
    du spec).
  - Respect des zones sûres (`viewport-fit=cover`, `env(safe-area-inset-*)`).
- **Rationale**: un `<button>` est nativement focalisable (Tab / Maj+Tab), annoncé par
  les lecteurs d'écran et stylable pour le focus ; les pourcentages rendent la
  responsivité gratuite ; les transitions CSS donnent le retour < 100 ms.
- **Alternatives considered**: `<canvas>` (accessibilité clavier et focus à recoder à
  la main, redessin au resize) ; SVG (possible, mais gestion du focus moins simple que
  des boutons).

## R4 — Saisie unifiée souris / toucher / clavier

- **Decision**:
  - **Pointer Events** (`pointerdown/move/up/cancel` + `setPointerCapture`) pour souris,
    stylet et doigt avec un seul code. `touch-action: none` sur les véhicules pour
    empêcher le défilement/zoom pendant un glissement.
  - Au `pointerdown`, l'UI demande au domaine la **plage de déplacement permise**
    (`getMoveRange`) ; pendant le glissement, le décalage (en cases fractionnaires) est
    borné à cette plage — le véhicule ne peut donc jamais traverser un obstacle, même
    sur un geste rapide. Au relâchement, arrondi à la case entière la plus proche, puis
    appel de `moveVehicle` (qui reborne).
  - **Clavier** : `keydown` sur le bouton focalisé ; flèche dans l'axe → `moveVehicle`
    d'une case ; flèches hors axe ignorées ; `preventDefault` pour éviter le défilement.
  - Un identifiant de « glissement en cours » est annulé par « Nouvelle partie » /
    « Recommencer » (cas limites du spec).
- **Rationale**: une seule source de vérité (le domaine) ; le bornage pendant le geste
  garantit SC-003.
- **Alternatives considered**: HTML5 Drag and Drop (inutilisable au toucher, pas de
  contrainte d'axe) ; Touch Events + Mouse Events séparés (code dupliqué).

## R5 — Format des cartes de défi (données, pas du code)

- **Decision**: chaque carte est un objet de données avec une grille de 6 chaînes de
  6 caractères (`.` = case vide, lettre = véhicule officiel), plus `id`, `difficulty`
  et `minMoves`. Le fichier `src/data/cards.js` exporte uniquement ce tableau littéral.
  Exemple : `["AA...O", "P..Q.O", "PXXQ.O", "P..Q..", "B...CC", "B.RRR."]`.
- **Rationale**: lisible et éditable à la main, compact, la longueur et l'orientation
  se déduisent de la grille ; un module JS exportant un littéral est importable à la
  fois par le navigateur et par `node:test` sans `fetch` ni attribut d'import JSON
  (dont le support navigateur est récent). La constitution autorise « JavaScript ou
  JSON ».
- **Alternatives considered**: `cards.json` + `fetch` (asynchrone, ne fonctionne pas en
  `file://`) ; liste explicite `{id,row,col,orientation}` (verbeuse, plus sujette aux
  erreurs de saisie).

## R6 — Solveur et vérification des cartes

- **Decision**: solveur **BFS** (parcours en largeur) dans le module domaine, où un
  coup = un véhicule glissé d'une distance quelconque dans une direction. L'état est
  encodé par une clé texte des positions. L'objectif est X sur les colonnes 5-6 (index
  4), ce coup final comptant comme un déplacement. Le test `cards.test.js` vérifie pour
  chaque carte : validité (FR-006), `minMoves` = résultat du solveur, `difficulty`
  cohérente (Facile 2–4, Moyen 5–10), et au moins 10 cartes avec ids uniques.
- **Rationale**: l'espace d'états d'une carte ≤ 10 coups est minuscule (< 1 s en
  Node) ; BFS donne directement le minimum exigé par le principe III.
- **Alternatives considered**: A* (inutile à cette taille) ; vérification manuelle
  (interdite par le principe III).
- **Constitution des cartes**: les cartes sont composées à la main (ou inspirées de
  positions classiques réécrites avec le jeu de véhicules officiel), puis le solveur
  donne `minMoves` ; un petit script de dev `node tools/rate-cards.js` affiche le
  minimum de chaque carte pour remplir les données.

## R7 — Tests automatisés

- **Decision**: `node:test` + `node:assert/strict` (Node ≥ 20 ; v22 disponible), lancés
  par `npm test` (`node --test tests/`). `package.json` ne contient que
  `"type": "module"` et le script de test — **aucune dépendance**.
- **Rationale**: principe II (test d'abord pour toutes les règles) sans ajouter
  d'outil ; outil de dev uniquement, jamais chargé par le jeu.
- **Alternatives considered**: Jest/Vitest (dépendances inutiles) ; tests UI
  automatisés Playwright (reportés : l'UI est validée par le guide `quickstart.md`
  ; les règles sont toutes couvertes au niveau domaine).

## R8 — Animation de victoire et message de succès

- **Decision**: quand `moveVehicle` place X en colonne d'index 4, le statut passe à
  `won` (FR-016). L'UI désactive les véhicules (FR-018), applique une transition CSS
  faisant sortir X au-delà du bord droit (~400 ms, respect de
  `prefers-reduced-motion`), puis ouvre un `<dialog>` modal : « Bravo ! » + emoji/
  confettis CSS + bouton « Rejouer » qui a le focus (FR-017, FR-019).
- **Rationale**: `<dialog>` natif gère le focus et la touche Échap ; pas de
  bibliothèque d'animation.
- **Alternatives considered**: canvas-confetti (dépendance) ; overlay `<div>` maison
  (gestion du focus à recoder).

## R9 — Sélection aléatoire

- **Decision**: fonction pure `pickCard(cards, excludeId, random)` où `random` est
  injecté (par défaut `Math.random`) ; exclut la carte courante si plus d'une carte
  existe (FR-021), sinon renvoie la seule carte.
- **Rationale**: testable de manière déterministe (principe I).

## R10 — Visuels des véhicules

- **Decision**: véhicules dessinés en CSS (rectangle arrondi, couleur officielle,
  grande lettre centrée en contraste suffisant, petites « vitres » décoratives) ;
  sortie signalée par une découpe du cadre et une flèche. Couleurs dans un objet
  `VEHICLE_COLORS` partagé.
- **Rationale**: dessins originaux (pas d'artwork ThinkFun), lettre = distinction hors
  couleur (FR-005), aucun fichier image à charger.
