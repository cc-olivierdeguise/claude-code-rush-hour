# Implementation Plan: Jeu Rush Hour sur le web

**Branch**: `001-rush-hour-web-game` | **Date**: 2026-10-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-rush-hour-web-game/spec.md`

**Directive utilisateur** : uniquement HTML et JavaScript, aucune base de données pour
l'instant ; page responsive, facilement utilisable comme application mobile et comme
application web.

## Summary

Une page unique, servie en fichiers statiques, affiche un plateau Rush Hour 6x6 tiré au
hasard parmi ≥ 10 cartes Faciles/Moyennes, permet de faire glisser les véhicules à la
souris, au doigt et au clavier selon les règles de l'édition standard, détecte la
victoire (X en colonnes 5-6) avec animation de sortie et message de fête, et offre
« Nouvelle partie » et « Recommencer ».

Approche : HTML + CSS + JavaScript natif (modules ES), sans framework, sans build,
sans backend ni base de données. Le cœur du jeu est un module domaine pur et testé
(`src/game/`), incluant un solveur BFS qui valide et note chaque carte dans la suite
de tests (`node:test`). L'UI rend le plateau en DOM/CSS avec des positions en
pourcentages (responsive natif) et gère toutes les entrées par Pointer Events + clavier.
La page est une **PWA** (manifest + service worker) : installable sur l'écran d'accueil
d'un téléphone/tablette ou en application de bureau, et jouable hors ligne.
Détails : [research.md](research.md).

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2022 (modules ES natifs) ; Node.js ≥ 20
(v22 installée) pour les tests uniquement

**Primary Dependencies**: aucune (ni à l'exécution ni en dev)

**Storage**: N/A — aucune base de données, aucune persistance ; cartes en données
statiques (`src/data/cards.js`) ; cache du service worker pour le hors-ligne

**Testing**: `node:test` + `node:assert/strict` (`npm test`) pour le domaine, le solveur
et les cartes ; validation UI manuelle selon [quickstart.md](quickstart.md)

**Target Platform**: navigateurs récents (Chrome/Edge, Firefox, Safari ; Android et
iOS ≥ 16.4) ; installable en PWA

**Project Type**: application web statique monopage (PWA)

**Performance Goals**: plateau jouable < 2 s (SC-001) ; retour visuel < 100 ms par
mouvement (FR-015), animations à 60 fps ; nouvelle partie < 1 s (SC-005) ; résolution
de toutes les cartes par le solveur < 5 s dans les tests

**Constraints**: aucun framework ni build ; aucun appel réseau pour jouer ; hors ligne
après le premier chargement ; utilisable de 320 px de large au bureau, portrait et
paysage ; cibles tactiles ≥ 44 px ; libellés courts en français

**Scale/Scope**: 1 page, ~10–20 cartes, ~6 modules JS, ~600–900 lignes au total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / contrainte | Conception | Statut |
|-----------------------|------------|--------|
| I. Logique pure et déterministe | `src/game/` (board, solver, cards) sans DOM/timers/stockage ; l'UI ne modifie l'état que via `moveVehicle`/`newGame` ; aléatoire injecté dans `pickCard` | ✅ |
| II. Test d'abord (règles) | `tests/board.test.js`, `pick.test.js` écrits et vus en échec avant l'implémentation de chaque règle (axe, blocage, bords, victoire, figé après victoire, recommencer) | ✅ |
| III. Cartes résolubles et notées | Cartes en données (`src/data/cards.js`) avec `difficulty` + `minMoves` ; `tests/cards.test.js` vérifie validité, `minMoves` = solveur BFS, Facile 2–4 / Moyen 5–10 | ✅ |
| IV. Simplicité | Aucune dépendance ; pas de framework, pas de build ; DOM + CSS ; PWA limitée à 2 fichiers (voir Complexity Tracking) | ✅ (1 ajout justifié) |
| V. Enfants, accessible, responsive | Souris/toucher/clavier (Pointer Events + `<button>` focalisables) ; lettre sur chaque véhicule ; transitions CSS < 100 ms ; coups illégaux bornés sans message ; plateau responsive | ✅ |
| VI. Édition standard | 6x6, sortie rangée 3 à droite, voitures 2 / camions 3, jeu X, A–K, O–R et couleurs officielles ; dessins CSS originaux | ✅ |
| Platform : HTML/CSS/JS, statique, sans backend ni BD | Fichiers statiques ; lancement via `npx serve` ; aucun appel réseau ; pas de télémétrie | ✅ |
| Platform : runner de tests en dev uniquement | `node:test` ; `package.json` sans dépendance, jamais chargé par le jeu | ✅ |

**Résultat avant Phase 0** : PASS. **Re-vérification après Phase 1** : PASS — les
contrats ([domain-api.md](contracts/domain-api.md), [card-data.md](contracts/card-data.md),
[ui.md](contracts/ui.md)) respectent la séparation domaine/UI, le format des cartes est
de la donnée, et aucune dépendance n'a été introduite.

## Project Structure

### Documentation (this feature)

```text
specs/001-rush-hour-web-game/
├── plan.md              # Ce fichier
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   ├── domain-api.md
│   ├── card-data.md
│   └── ui.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — non créé ici)
```

### Source Code (repository root)

```text
index.html                 # Page unique : plateau, contrôles, <dialog> de victoire
manifest.webmanifest       # PWA : nom, display standalone, icônes, couleurs
sw.js                      # Service worker : pré-cache des fichiers statiques (hors ligne)
package.json               # "type": "module" + script "test" ; aucune dépendance
icons/
├── icon-192.png
├── icon-512.png
├── icon-maskable-512.png
└── apple-touch-icon.png   # 180x180
src/
├── game/                  # Domaine pur (principe I)
│   ├── board.js           # parseCard, newGame, getMoveRange, moveVehicle, isWon, constantes
│   ├── solver.js          # solve (BFS)
│   └── cards.js           # pickCard, difficultyFor
├── data/
│   └── cards.js           # CARDS : données des cartes de défi (≥ 10)
├── ui/
│   ├── render.js          # Création/mise à jour des boutons-véhicules, couleurs, animation de sortie
│   ├── input.js           # Pointer Events (glisser borné) + clavier (flèches)
│   └── colors.js          # VEHICLE_COLORS (code couleur officiel)
├── app.js                 # Point d'entrée : état de partie, boutons, dialogue, enregistrement du SW
└── styles.css             # Mise en page responsive, plateau, véhicules, focus, animations
tests/
├── board.test.js          # Règles de déplacement et de victoire
├── cards.test.js          # Validité + solveur + difficulté de chaque carte
└── pick.test.js           # Sélection aléatoire excluant la carte courante
tools/
└── rate-cards.js          # Dev : affiche le minMoves calculé de chaque carte
```

**Structure Decision**: projet unique statique à la racine du dépôt (`index.html`
servi directement, exigé par la constitution). `src/game/` = domaine pur testable en
Node ; `src/ui/` + `src/app.js` = couche navigateur ; `src/data/` = cartes en données ;
fichiers PWA à la racine pour que le service worker contrôle tout le site.

## Complexity Tracking

| Ajout | Pourquoi nécessaire | Alternative plus simple rejetée parce que |
|-------|---------------------|-------------------------------------------|
| PWA (`manifest.webmanifest` + `sw.js` + icônes) | Demande explicite : « facilement utilisable en tant que mobile app » ; installation sur l'écran d'accueil, plein écran, et fonctionnement hors ligne (hypothèse du spec, contrainte constitution) | Page web seule : pas d'installation ni de garantie hors ligne. Emballage natif (Capacitor/Cordova) : outillage et build, hors « HTML + JS ». Le SW reste ~30 lignes de JS natif, sans dépendance. |
