---

description: "Liste de tâches pour l'implémentation du jeu Rush Hour sur le web"
---

# Tasks: Jeu Rush Hour sur le web

**Input**: Documents de conception dans `/specs/001-rush-hour-web-game/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (domain-api.md, card-data.md, ui.md), quickstart.md

**Tests**: OBLIGATOIRES pour toutes les règles de jeu — principe II de la constitution (« Test-First for Game Rules, NON-NEGOTIABLE ») et principe III (cartes vérifiées par le solveur). Chaque tâche de test doit être écrite et **vue en échec** (`npm test`) avant la tâche d'implémentation correspondante. L'UI est validée manuellement via [quickstart.md](quickstart.md).

**Organization**: tâches groupées par user story pour permettre une implémentation et une validation indépendantes.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers différents, aucune dépendance sur une tâche inachevée)
- **[Story]** : user story concernée (US1, US2, US3)
- Chemins relatifs à la racine du dépôt (projet statique unique, voir plan.md › Project Structure)

## Rappels transverses (s'appliquent à toutes les tâches)

- `src/game/**` = domaine pur : **aucun** accès au DOM, aux timers, au stockage ni au réseau ; fonctions déterministes ne modifiant jamais leurs arguments (contrat [domain-api.md](contracts/domain-api.md)).
- Aucune dépendance npm, aucun framework, aucune étape de build. JSDoc pour documenter les types.
- Indices lignes/colonnes à partir de 0 ; `BOARD_SIZE = 6`, `EXIT_ROW = 2`, `WIN_COL = 4`.
- Libellés d'interface courts et en français.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: initialisation du projet statique et du lanceur de tests

- [X] T001 Créer `package.json` à la racine avec uniquement `"name": "rush-hour"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=20" }` et `"scripts": { "test": "node --test tests/" }` — **aucune** section `dependencies`/`devDependencies`
- [X] T002 [P] Créer l'arborescence vide du plan : dossiers `src/game/`, `src/data/`, `src/ui/`, `tests/`, `tools/`, `icons/` (ajouter un `.gitkeep` dans `icons/` en attendant T042)
- [X] T003 [P] Créer `.gitignore` à la racine ignorant `node_modules/`, `.DS_Store`, `Thumbs.db`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modèle de plateau, validation des cartes, solveur, données de cartes et sélection aléatoire — requis par toutes les user stories

**⚠️ CRITICAL**: aucune user story ne peut commencer avant la fin de cette phase

### Tests fondamentaux (écrire d'abord, voir échouer)

- [X] T004 Écrire `tests/board.test.js` (section `describe("parseCard")`) avec `node:test` + `node:assert/strict`, important depuis `../src/game/board.js` : (a) une grille valide donne les bons véhicules `{ id, orientation, length, row, col }` (row/col = case de tête, la plus haute/gauche) ; (b) `parseCard` lève une `Error` au message explicite pour chacun de ces cas : moins/plus de 6 lignes, ligne ≠ 6 caractères, caractère hors `.` `X` `A`–`K` `O`–`R`, `X` absent, `X` vertical, `X` hors de la ligne `EXIT_ROW` (2), `X` déjà en colonne 4, lettre non contiguë, lettre en forme de L, voiture (`X`, `A`–`K`) de longueur ≠ 2, camion (`O`, `P`, `Q`, `R`) de longueur ≠ 3, même lettre présente deux fois comme deux segments séparés ; (c) constantes exportées `BOARD_SIZE === 6`, `EXIT_ROW === 2`, `WIN_COL === 4`, `TRUCK_IDS` contient exactement `O`,`P`,`Q`,`R`
- [X] T005 Ajouter dans `tests/board.test.js` (section `describe("occupancy / newGame")`) : `occupancy(vehicles)` renvoie une grille 6x6 d'ids ou `null` ; `newGame(card)` renvoie `{ cardId: card.id, vehicles: parseCard(card), status: "playing" }` ; deux appels `newGame(card)` successifs donnent des états égaux en profondeur et `card` n'est pas modifiée ; règle « Recommencer » (FR-024, principe II) : `newGame(card)` ne dépend que de `card` (aucun état de partie précédent en entrée) et renvoie toujours `status === "playing"` — les cas « après des déplacements » et « après une victoire » sont testés en T012 (n)/(o)
- [X] T006 [P] Écrire `tests/pick.test.js` important `../src/game/cards.js` : (a) `pickCard(cards, excludeId, random)` n'exclut jamais une carte autre que `excludeId` et ne renvoie jamais `excludeId` quand `cards.length > 1` (tester avec `random` injecté renvoyant 0, 0.5, 0.999…) ; (b) tirage uniforme : avec `random = () => k / n` on atteint chaque carte restante ; (c) une seule carte → renvoyée même si `excludeId` est son id ; (d) `excludeId` absent/inconnu → tirage parmi toutes les cartes ; (e) `cards` vide → lève une `Error` ; (f) `difficultyFor(n)` : `null` pour 0 et 1, `"easy"` pour 2,3,4, `"medium"` pour 5…10, `null` pour 11
- [X] T007 [P] Écrire `tests/solver.test.js` important `../src/game/solver.js` : (a) carte où X a le chemin libre (`X` en colonne 0, rangée 2 vide sinon) → `minMoves === 1` et `path` = `[{ id: "X", delta: 4 }]` ; (b) carte où un seul véhicule vertical bloque la rangée 2 → `minMoves === 2` ; (c) carte construite comme insoluble (rangée 2 bloquée par un camion vertical `O` coincé entre deux véhicules immobiles en haut et en bas) → `null` ; (d) rejouer `path` via `moveVehicle` depuis `newGame(card)` aboutit à `status === "won"` en exactement `minMoves` coups ; (e) `solve` ne modifie pas `card`
- [X] T008 [P] Écrire `tests/cards.test.js` important `CARDS` depuis `../src/data/cards.js` et `parseCard`, `solve`, `difficultyFor` : (a) `CARDS.length >= 10` ; (b) ids uniques et conformes à `/^[EM]\d{2}$/` (`E##` ⇔ `easy`, `M##` ⇔ `medium`) ; (c) pour chaque carte : `parseCard` ne lève pas (FR-006) ; `solve(card)` n'est pas `null` ; `card.minMoves === solve(card).minMoves` ; `card.difficulty === difficultyFor(card.minMoves)` (« `easy` ⇔ `minMoves` ∈ [2,4] ; `medium` ⇔ `minMoves` ∈ [5,10] ») ; (d) au moins une carte `easy` et au moins une carte `medium` ; (e) l'ensemble des tests de cartes s'exécute en < 5 s ; (f) pour chaque carte de `CARDS`, une séquence de ≥ 200 coups pseudo-aléatoires déterministes (`moveVehicle` depuis `newGame(card)`) ne produit jamais de chevauchement dans `occupancy` ni de véhicule hors du plateau (SC-003)

### Implémentation fondamentale

- [X] T009 Implémenter dans `src/game/board.js` les constantes exportées `BOARD_SIZE = 6`, `EXIT_ROW = 2`, `WIN_COL = 4`, `TRUCK_IDS = ["O","P","Q","R"]`, les typedefs JSDoc `Card`, `Vehicle`, `Game` (data-model.md) et `parseCard(card)` appliquant toutes les règles de validation de [card-data.md](contracts/card-data.md) : « exactement 6 lignes de 6 caractères, caractères autorisés uniquement » ; « `X` présent, horizontal, sur la ligne `EXIT_ROW`, et pas déjà en colonne 4 » ; « chaque lettre forme un segment contigu sur une seule ligne ou une seule colonne » ; « longueur = 2 pour `X`, `A`–`K` ; 3 pour `O`, `P`, `Q`, `R` » ; « chaque lettre apparaît au plus une fois comme véhicule ». Messages d'erreur incluant `card.id` et la lettre fautive. Renvoie les véhicules triés par id (X d'abord) — fait passer T004
- [X] T010 Implémenter dans `src/game/board.js` `occupancy(vehicles)` (grille 6x6 de `string|null`) et `newGame(card)` → `{ cardId: card.id, vehicles: parseCard(card), status: "playing" }` — fait passer T005
- [X] T011 [P] Implémenter `src/game/cards.js` : `pickCard(cards, excludeId, random = Math.random)` (filtre `excludeId` si `cards.length > 1`, puis `pool[Math.floor(random() * pool.length)]`, borné à `pool.length - 1` ; `Error` si `cards` vide) et `difficultyFor(minMoves)` (`easy` 2–4, `medium` 5–10, `null` sinon) — fait passer T006
- [X] T012 Ajouter dans `tests/board.test.js` (section `describe("getMoveRange / moveVehicle / isWon")`) les tests des règles de déplacement **avant** T013 (dépend de T010 pour les fixtures) : (a) `getMoveRange` d'un véhicule H libre entre deux bords = `{ min: -col, max: 6 - length - col }` ; (b) borné par le premier obstacle de chaque côté ; (c) `{0,0}` pour un id inconnu et quand `status === "won"` ; (d) `min ≤ 0 ≤ max` toujours ; (e) un véhicule `H` ne change jamais de `row`, un `V` jamais de `col` après `moveVehicle` (FR-010) ; (f) `delta` supérieur à la distance libre → s'arrête juste avant l'obstacle, jamais de saut par-dessus un véhicule intermédiaire (FR-011, cas limite) ; (g) poussée contre un bord → reste dans le plateau (FR-012) ; (h) X poussé vers la gauche au-delà de la colonne 0 → reste en colonne 0 ; (i) déplacement effectif 0 → renvoie **le même objet** (`===`) (FR-014) ; (j) déplacement légal → nouvel objet, l'ancien état et ses véhicules non modifiés ; (k) après tout `moveVehicle`, `occupancy` ne montre aucun chevauchement et tous les véhicules sont dans le plateau (propriété vérifiée sur une séquence de ≥ 200 coups pseudo-aléatoires déterministes sur une carte **définie en dur dans le fichier de test** — ne pas importer `src/data/cards.js`, qui n'existe qu'à partir de T016 ; la même propriété sur toutes les cartes réelles est couverte par T008 (f)) ; (l) `status` passe à `"won"` exactement quand X atteint la colonne `WIN_COL` (4), jamais autrement, et `isWon` le reflète (FR-016, SC-004) ; (m) après `"won"`, `moveVehicle` sur n'importe quel véhicule renvoie l'état inchangé (`===`) (FR-018) ; (n) « Recommencer » après plusieurs `moveVehicle` : `newGame(card)` sur la même carte renvoie un état égal en profondeur à l'état initial, `status === "playing"`, et l'état précédent n'est pas modifié (FR-024) ; (o) « Recommencer » après une victoire : `newGame(card)` renvoie un état `"playing"` où les déplacements sont de nouveau acceptés (`moveVehicle` renvoie un nouvel objet pour un coup légal) (FR-024, US2-5)
- [X] T013 Implémenter dans `src/game/board.js` `getMoveRange(game, id)`, `moveVehicle(game, id, delta)` (delta borné à `getMoveRange`, retour du même objet si effectif 0 ou partie gagnée, passage à `"won"` si X atteint `WIN_COL`) et `isWon(game)` — fait passer T012. Remarque : ces règles sont utilisées par le solveur, c'est pourquoi elles sont en phase fondationnelle ; leur exposition au joueur se fait en US1
- [X] T014 Implémenter `src/game/solver.js` : `solve(card, maxDepth = 20)` en BFS ; état = clé texte des positions (ex. concaténation `id+row+col` triée) ; coups = pour chaque véhicule, chaque `delta` non nul dans `getMoveRange` ; objectif = X en colonne `WIN_COL`, coup final de X compté ; renvoie `{ minMoves, path: [{ id, delta }] }` ou `null` si insoluble dans `maxDepth` ; réutilise `newGame`/`getMoveRange`/`moveVehicle` de `src/game/board.js` — fait passer T007
- [X] T015 [P] Créer `tools/rate-cards.js` (script Node de dev) : importe `CARDS` et `solve`, affiche pour chaque carte `id`, `minMoves` calculé, `difficultyFor(minMoves)`, et signale en clair toute carte invalide (`parseCard` lève), insoluble, à 1 coup, à > 10 coups, ou dont `minMoves`/`difficulty` stockés diffèrent du calcul
- [X] T016 Créer `src/data/cards.js` exportant **uniquement** le littéral `export const CARDS = [ … ]` au format de [card-data.md](contracts/card-data.md) : ≥ 12 cartes (≈ 5 `easy` `E01`…, ≈ 7 `medium` `M01`…), grilles de 6 chaînes de 6 caractères utilisant le jeu officiel (X, A–K, O–R), variées (véhicules H et V, au moins un camion par carte moyenne). Composer les grilles, lancer `node tools/rate-cards.js`, puis renseigner `minMoves` et `difficulty` à partir du résultat ; écarter/retoucher toute carte hors [2,10] — fait passer T008
- [X] T017 [P] Créer `src/ui/colors.js` exportant `VEHICLE_COLORS` (code couleur officiel, principe VI) : `X` rouge, `A` vert clair, `B` orange, `C` bleu clair, `D` rose, `E` bleu foncé/violet, `F` vert foncé, `G` gris argent, `H` beige, `I` jaune, `J` marron, `K` olive, `O` camion jaune, `P` camion violet, `Q` camion bleu, `R` camion turquoise ; chaque entrée `{ bg, fg, name }` où `fg` (couleur de la lettre) a un contraste ≥ 4.5:1 avec `bg` et `name` est le nom français de la couleur (pour `aria-label`)
- [X] T018 Vérifier `npm test` : 100 % des tests de T004–T008 et T012 passent

**Checkpoint**: domaine complet et testé, ≥ 10 cartes valides et notées — les user stories peuvent commencer

---

## Phase 3: User Story 1 - Jouer une partie jusqu'à la victoire (Priority: P1) 🎯 MVP

**Goal**: ouvrir la page, voir un plateau 6x6 tiré au hasard, déplacer les véhicules à la souris, au doigt et au clavier selon les règles, et voir X sortir avec le message « Bravo ! ».

**Independent Test**: `npx serve .`, ouvrir la page, résoudre la carte à la souris (puis au doigt et au clavier) ; constater le blocage aux obstacles et aux bords, la sortie animée de X et l'apparition de « Bravo ! », puis qu'aucun véhicule ne bouge plus (quickstart §3 scénarios 1–6).

### Implementation for User Story 1

- [X] T019 [US1] Créer `index.html` (`<!doctype html>`, `<html lang="fr">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<title>Rush Hour</title>`, `<link rel="stylesheet" href="src/styles.css">`, `<script type="module" src="src/app.js">`) contenant : `<main>` avec `<h1>Rush Hour</h1>`, `<div id="board" role="group" aria-label="Plateau de jeu">` incluant un élément décoratif `.exit` (`aria-hidden="true"`) signalant la sortie à droite de la 3e rangée, `<div class="controls">` (vide pour l'instant, rempli en US2), et `<dialog id="win-dialog" aria-labelledby="win-title">` contenant `<h2 id="win-title">Bravo !</h2>` et un élément de fête `.confetti` (`aria-hidden="true"`, emoji 🎉🚗 + confettis CSS)
- [X] T020 [P] [US1] Créer `src/styles.css` — mise en page : variables de thème sur `:root` ; `body` sans marge, fond explicite, `padding: env(safe-area-inset-*)` ; `main` en colonne (portrait) et en ligne (media query `(orientation: landscape)`, contrôles à côté du plateau) ; aucun défilement horizontal de 320 px au bureau ; `#board` carré (`aspect-ratio: 1`, `width: min(94vw, calc(100dvh - <hauteur titre+contrôles>))` en portrait, équivalent en paysage), `position: relative`, quadrillage 6x6 en `background` (dégradés répétés) ; `.exit` : découpe du cadre + flèche sur le bord droit à la hauteur de la rangée d'index 2 ; `user-select: none`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` sur la page (pas de zoom double-tap)
- [X] T021 [P] [US1] Ajouter dans `src/styles.css` le style `.vehicle` : `<button>` en `position: absolute`, positionné par variables CSS `--row`, `--col`, `--len`, `--dx`, `--dy` (en cases fractionnaires) converties en pourcentages du plateau (`left: calc(var(--col) * 100% / 6)`, largeur/hauteur selon `.h`/`.v` et `--len`, `transform: translate(calc(var(--dx) * 100%/…), …)`) ; marge interne pour l'espacement entre véhicules ; coins arrondis ; couleur `--bg`/`--fg` ; grande lettre centrée ; « vitres » décoratives en pseudo-éléments ; `touch-action: none` ; `transition: left/top/transform 80ms ease-out` (< 100 ms, FR-015) désactivée pendant le glissement (`.dragging`) ; anneau de focus `:focus-visible` épais (≥ 4 px) et contrasté (FR-009) ; état `[aria-disabled="true"]` sans curseur de saisie ; classe `.exiting` faisant sortir X au-delà du bord droit en ~400 ms ; `@media (prefers-reduced-motion: reduce)` → transitions instantanées
- [X] T022 [US1] Créer `src/ui/render.js` : `renderBoard(boardEl, game)` crée/met à jour un `<button class="vehicle h|v" type="button" data-id>` par véhicule (réutilise les boutons existants par `data-id`, supprime ceux qui n'existent plus), fixe `--row`, `--col`, `--len`, `--bg`, `--fg` depuis `VEHICLE_COLORS` (`src/ui/colors.js`), le texte = la lettre (FR-005), `aria-label` = « Voiture X, rouge, horizontale » / « Camion O, jaune, verticale » ; ordre DOM = ordre de tabulation stable (X d'abord) ; `setDisabled(boardEl, bool)` pose `aria-disabled` sur tous les véhicules (garde le focus possible) ; `playExit(boardEl, gameToken, getToken)` → ajoute `.exiting` à X et renvoie une `Promise` résolue au `transitionend` (ou immédiatement si `prefers-reduced-motion`, avec un délai de secours de 600 ms)
- [X] T023 [US1] Créer `src/ui/input.js` — glisser au pointeur : `attachInput(boardEl, { getGame, onMove })` ; sur `pointerdown` d'un `.vehicle` non désactivé : `setPointerCapture`, mémoriser l'état `drag = { vehicleId, pointerId, startX, startY, range: getMoveRange(getGame(), id), offset: 0 }` (data-model.md › État d'interface), ajouter `.dragging` ; sur `pointermove` : projeter le déplacement du pointeur **sur l'axe du véhicule uniquement** (FR-010), le convertir en cases (`px / (boardEl.clientWidth / 6)`), le borner à `[range.min, range.max]` (pas de traversée même sur geste rapide, SC-003) et l'appliquer via `--dx`/`--dy` ; sur `pointerup`/`pointercancel` : arrondir `offset` à l'entier le plus proche, retirer `.dragging`, remettre `--dx`/`--dy` à 0, appeler `onMove(id, delta)` si `delta !== 0` (FR-013) ; exporter `cancelDrag()` qui libère la capture et remet `drag = null` sans appeler `onMove` (utilisé en US2)
- [X] T024 [US1] Ajouter dans `src/ui/input.js` la gestion clavier : `keydown` sur un `.vehicle` focalisé ; `ArrowLeft`/`ArrowRight` pour un véhicule `h`, `ArrowUp`/`ArrowDown` pour un `v` → `onMove(id, ±1)` (le domaine borne, rien ne se passe si bloqué, FR-014) ; flèches hors axe ignorées ; `preventDefault()` sur toutes les flèches pour empêcher le défilement ; ignorer si le véhicule est `aria-disabled` ; le focus reste sur le véhicule déplacé après re-rendu
- [X] T025 [US1] Créer `src/app.js` : importe `CARDS`, `newGame`, `moveVehicle`, `pickCard` et les modules UI ; état module `{ card, game, gameToken }` ; `startGame(card)` → `gameToken++`, `game = newGame(card)`, retire `.exiting`, `renderBoard`, `setDisabled(false)` ; au chargement : `startGame(pickCard(CARDS))` (FR-008, SC-001) ; `onMove(id, delta)` → `next = moveVehicle(game, id, delta)` ; si `next === game` ne rien faire ; sinon `game = next`, `renderBoard` ; si `game.status === "won"` → `handleWin()`
- [X] T026 [US1] Implémenter `handleWin()` dans `src/app.js` : `setDisabled(true)` (FR-018), mémoriser `token = gameToken`, `await playExit(...)`, puis si `token === gameToken` (pas de nouvelle partie entre-temps) ouvrir `#win-dialog` avec `showModal()` (FR-016, FR-017)
- [X] T027 [US1] Ajouter dans `src/styles.css` le style de `#win-dialog` : centré, gros titre « Bravo ! » (≥ 2.5 rem), fond festif, `::backdrop` semi-transparent, animation de confettis CSS (pseudo-éléments / petits éléments colorés tombant) désactivée sous `prefers-reduced-motion`
- [X] T028 [US1] Valider US1 manuellement selon [quickstart.md](quickstart.md) §3 scénarios 1 à 6 à la souris, puis au clavier et au toucher (mode appareil des DevTools) ; corriger tout écart dans les fichiers concernés

**Checkpoint**: le jeu est jouable de bout en bout jusqu'à la victoire (MVP)

---

## Phase 4: User Story 2 - Recommencer avec une nouvelle partie à tout moment (Priority: P2)

**Goal**: contrôles « Nouvelle partie » (nouvelle carte différente) et « Recommencer » (même carte, état initial), toujours disponibles, abandonnant proprement tout glissement en cours.

**Independent Test**: en cours de partie, déplacer quelques véhicules ; « Recommencer » → même carte à l'état initial ; « Nouvelle partie » (plusieurs fois vite, et pendant un glissement) → carte différente, propre, sans état mélangé (quickstart §3 scénarios 7–8).

### Tests for User Story 2 ⚠️

> Écrire d'abord et voir échouer si un comportement manque.

- ~~T029~~ *Supprimée* : les tests de la règle « Recommencer » sont écrits avant son implémentation, en T005 et T012 (n)/(o) (principe II — un test écrit après `newGame` ne pourrait pas être vu en échec). ID conservé pour la stabilité des références.
- [X] T030 [P] [US2] Ajouter dans `tests/pick.test.js` un test simulant 100 « Nouvelle partie » successives sur `CARDS` réel avec un `random` pseudo-aléatoire déterministe (ex. LCG à graine fixe) : chaque carte tirée a un id différent de la précédente (FR-021, US2-2)

### Implementation for User Story 2

- [X] T031 [US2] Ajouter dans `index.html`, dans `.controls`, `<button id="btn-new" type="button">Nouvelle partie</button>` et `<button id="btn-restart" type="button">Recommencer</button>` (après le plateau dans l'ordre de tabulation)
- [X] T032 [P] [US2] Ajouter dans `src/styles.css` le style des contrôles : cibles ≥ 44×44 px, texte ≥ 18 px, contraste suffisant, focus visible identique aux véhicules, disposition en ligne sous le plateau (portrait) et en colonne à côté (paysage)
- [X] T033 [US2] Dans `src/app.js`, ajouter `resetUi()` : `cancelDrag()` (de `src/ui/input.js`), fermer `#win-dialog` s'il est ouvert, puis brancher `#btn-new` → `resetUi(); startGame(pickCard(CARDS, card.id))` (FR-021, FR-022) et `#btn-restart` → `resetUi(); startGame(card)` sans confirmation, actif à tout moment y compris après une victoire (rejoue alors la carte résolue, véhicules réactivés par `startGame`) (FR-024, US2-5) ; `startGame` incrémentant `gameToken`, toute animation de sortie ou tout `pointerup` tardif de la partie précédente est ignoré (cas limites « plusieurs fois de suite rapidement » et « pendant un glissement »)
- [X] T034 [US2] Dans `src/ui/input.js`, garantir qu'un `pointermove`/`pointerup` reçu après `cancelDrag()` ou pour un `pointerId` différent de `drag.pointerId` est ignoré, et que `renderBoard` d'une nouvelle partie remet `--dx`/`--dy` à 0 et retire `.dragging`/`.exiting` de tous les véhicules
- [X] T035 [US2] Valider US2 manuellement selon [quickstart.md](quickstart.md) §3 scénarios 7 et 8 (souris, toucher, clavier) ; vérifier `npm test` vert

**Checkpoint**: US1 et US2 fonctionnent indépendamment

---

## Phase 5: User Story 3 - Rejouer après une victoire (Priority: P3)

**Goal**: le message de succès propose « Rejouer », qui ferme le message et lance une nouvelle carte différente et jouable.

**Independent Test**: gagner une partie, activer « Rejouer » (souris, doigt, Entrée au clavier) → le dialogue disparaît, une nouvelle carte différente s'affiche, jouable jusqu'à une nouvelle victoire (quickstart §3 scénario 9).

### Implementation for User Story 3

- [X] T036 [US3] Ajouter dans `index.html`, dans `#win-dialog`, `<button id="btn-replay" type="button" autofocus>Rejouer</button>` (FR-019)
- [X] T037 [P] [US3] Ajouter dans `src/styles.css` le style de `#btn-replay` : bouton principal très visible, ≥ 56 px de haut, texte ≥ 22 px, focus visible
- [X] T038 [US3] Dans `src/app.js`, brancher `#btn-replay` → même action que « Nouvelle partie » (`resetUi(); startGame(pickCard(CARDS, card.id))`) ; s'assurer que le focus va sur « Rejouer » à l'ouverture du dialogue, et qu'à sa fermeture le focus revient sur le premier véhicule (X) du nouveau plateau
- [X] T039 [US3] Dans `src/app.js`, gérer l'événement `cancel` de `#win-dialog` (touche Échap) : fermer le dialogue en laissant la partie gagnée figée (véhicules toujours désactivés) et le focus sur `#btn-new`, pour que « Nouvelle partie » et « Recommencer » restent les issues (FR-020, FR-024)
- [X] T040 [US3] Valider US3 manuellement selon [quickstart.md](quickstart.md) §3 scénario 9, puis enchaîner deux victoires d'affilée pour vérifier que la seconde est détectée (US3-2)

**Checkpoint**: les trois user stories sont fonctionnelles

---

## Phase 6: Polish & Cross-Cutting Concerns (PWA, responsive, validation finale)

**Purpose**: installation en application mobile/web, hors ligne, finitions transverses

- [X] T041 [P] Créer `tools/make-icons.js` (script Node de dev, uniquement modules intégrés `node:zlib` et `node:fs`) qui encode des PNG RGBA (signature, IHDR, IDAT compressé, IEND, CRC32) représentant un dessin original simple (fond uni, voiture rouge stylisée, flèche de sortie — aucun artwork ThinkFun) et écrit `icons/icon-192.png` (192×192), `icons/icon-512.png` (512×512), `icons/icon-maskable-512.png` (512×512, motif dans la zone sûre centrale de 80 %) et `icons/apple-touch-icon.png` (180×180, fond opaque)
- [X] T042 Exécuter `node tools/make-icons.js`, vérifier visuellement les 4 icônes et supprimer `icons/.gitkeep`
- [X] T043 [P] Créer `manifest.webmanifest` : `name: "Rush Hour"`, `short_name: "Rush Hour"`, `lang: "fr"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `orientation: "any"`, `background_color` et `theme_color` alignés sur `src/styles.css`, `icons` : 192 et 512 (`purpose: "any"`) + `icon-maskable-512.png` (`purpose: "maskable"`)
- [X] T044 Ajouter dans `<head>` de `index.html` : `<link rel="manifest" href="manifest.webmanifest">`, `<meta name="theme-color" content="…">`, `<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-title" content="Rush Hour">`, `<link rel="icon" href="icons/icon-192.png">`
- [X] T045 [P] Créer `sw.js` à la racine (~30 lignes) : `CACHE = "rush-hour-v1"` ; `install` → pré-cache de la liste fixe `./`, `index.html`, `manifest.webmanifest`, `src/styles.css`, `src/app.js`, `src/game/board.js`, `src/game/solver.js`, `src/game/cards.js`, `src/data/cards.js`, `src/ui/render.js`, `src/ui/input.js`, `src/ui/colors.js`, les 4 icônes, puis `skipWaiting()` ; `activate` → suppression des caches dont le nom ≠ `CACHE` + `clients.claim()` ; `fetch` (GET même origine uniquement) → cache d'abord, sinon réseau
- [X] T046 Dans `src/app.js`, enregistrer le service worker : `if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) navigator.serviceWorker.register("./sw.js")` après `load`, erreurs ignorées silencieusement (le jeu reste jouable sans SW)
- [X] T047 [P] Vérifier que `src/game/**` n'importe rien depuis `src/ui/` ni n'utilise `document`, `window`, `setTimeout`, `localStorage`, `fetch` (principe I) — `grep` et correction si nécessaire
- [X] T048 [P] Vérifier qu'aucune fonctionnalité hors périmètre n'a été ajoutée (comptes, classement, compteur de coups, chronomètre, historique, `localStorage`, télémétrie, appel réseau) (FR-023, constitution › Platform)
- [X] T049 Valider le responsive selon [quickstart.md](quickstart.md) §4.1 : 320×568, 390×844, tablette, paysage, rotation en cours de partie (positions conservées) ; corriger `src/styles.css` si besoin
- [X] T050 Valider l'installation PWA et le hors-ligne selon [quickstart.md](quickstart.md) §4.2–4.4 (Lighthouse › installable, mode Offline des DevTools) ; incrémenter `CACHE` dans `sw.js` si des fichiers listés ont changé après un premier déploiement
- [X] T051 Exécuter la validation complète de [quickstart.md](quickstart.md) (§1 `npm test` vert, §3 scénario 10 : souris seule, toucher seul, clavier seul — SC-007) et vérifier SC-001 (plateau < 2 s) et SC-005 (nouvelle partie < 1 s)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dépendance
- **Foundational (Phase 2)** : dépend de Setup — BLOQUE toutes les user stories
- **US1 (Phase 3)** : dépend de Foundational
- **US2 (Phase 4)** : dépend de Foundational ; s'intègre à `src/app.js`, `src/ui/input.js` et `index.html` créés en US1 (T019, T023, T025) — à faire après US1 en pratique (même fichiers)
- **US3 (Phase 5)** : dépend de US1 (dialogue de victoire, T026) et réutilise l'action « Nouvelle partie » et `resetUi()` de US2 (T033)
- **Polish (Phase 6)** : T041–T046 peuvent démarrer dès la fin de US1 ; T049–T051 après toutes les user stories

### Ordre test-first dans la phase fondationnelle

```text
T004 → T009 ; T005 → T010 ; T006 → T011 ; T012 → T013 ; T007 → T014 ; T008 → T016
T009 → T010 → T012 → T013 → T014 → T015 → T016 → T018
```

### Within Each User Story

- Test T030 écrit avant le code de l'US2 (les tests « Recommencer » sont en T005/T012, phase 2)
- Balisage (`index.html`) → styles → modules UI → câblage `src/app.js` → validation manuelle
- Toujours `npm test` vert à la fin de chaque phase

### Parallel Opportunities

- Phase 1 : T002, T003 en parallèle (après ou avec T001)
- Phase 2 : T006, T007, T008 en parallèle de T004/T005 (fichiers de test différents) ; T011, T015, T017 en parallèle des tâches de `board.js`
- US1 : T020 et T021 sont dans le même fichier (`src/styles.css`) mais sur des sections distinctes — parallélisables seulement s'ils sont fusionnés avec soin ; T020/T021 en parallèle de T022–T024
- US2 : T030 et T032 en parallèle de T031
- US3 : T037 en parallèle de T036/T038
- Phase 6 : T041, T043, T045, T047, T048 en parallèle

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Tests écrits en parallèle (fichiers distincts) :
Task: "T006 Écrire tests/pick.test.js (pickCard, difficultyFor)"
Task: "T007 Écrire tests/solver.test.js (solve BFS)"
Task: "T008 Écrire tests/cards.test.js (validité, minMoves, difficulté de CARDS)"

# Implémentations indépendantes :
Task: "T011 Implémenter src/game/cards.js"
Task: "T017 Créer src/ui/colors.js (VEHICLE_COLORS)"
```

## Parallel Example: User Story 1

```bash
Task: "T020 Mise en page responsive et plateau dans src/styles.css"
Task: "T022 Créer src/ui/render.js"
Task: "T023 Créer src/ui/input.js (Pointer Events)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 : Setup
2. Phase 2 : Foundational (domaine + solveur + cartes, tous les tests verts)
3. Phase 3 : US1
4. **STOP et VALIDER** : jouer jusqu'à la victoire à la souris, au doigt et au clavier
5. Démo possible (recharger la page = nouvelle partie)

### Incremental Delivery

1. Setup + Foundational → domaine prêt et prouvé par les tests
2. + US1 → jeu jouable (MVP)
3. + US2 → « Nouvelle partie » / « Recommencer »
4. + US3 → « Rejouer » depuis le message de victoire
5. + Polish → PWA installable, hors ligne, validation finale

---

## Notes

- [P] = fichiers différents, aucune dépendance sur une tâche inachevée
- Toute modification d'une règle de jeu exige la modification du test correspondant (principe II)
- Toute nouvelle carte doit passer `node tools/rate-cards.js` puis `npm test` (principe III)
- Commit après chaque tâche ou groupe logique ; `main` doit rester avec tous les tests verts

---

## Phase 7: Convergence

- [X] T052 Dans `sw.js`, servir la page en cache `./` pour toute requête de navigation (`request.mode === "navigate"`) absente du cache (ex. `index.html`, URL avec `?query`), afin que le jeu se recharge hors ligne quelle que soit l'URL d'entrée (VS Code Live Server ouvre `/index.html`) ; incrémenter `CACHE` en `rush-hour-v2` per plan: PWA hors ligne / Constitution › Platform « work offline once loaded » / T045 (partial)
