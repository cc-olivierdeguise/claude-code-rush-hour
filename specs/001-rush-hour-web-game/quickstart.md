# Quickstart — validation de bout en bout

**Feature**: `001-rush-hour-web-game`

## Prérequis

- Node.js ≥ 20 (tests uniquement ; le jeu n'en dépend pas).
- Un navigateur récent (Chrome/Edge, Firefox, Safari) ; idéalement un téléphone sur
  le même réseau Wi-Fi pour le test mobile.

## 1. Tests automatisés (règles + cartes)

```bash
npm test          # = node --test tests/
```

Attendu : tous les tests passent, dont :

- `tests/board.test.js` — axe, blocage, bords, pas de saut, victoire, état figé après
  victoire, recommencer ([domain-api.md](contracts/domain-api.md)) ;
- `tests/cards.test.js` — chaque carte est valide, résoluble, `minMoves` = solveur,
  difficulté cohérente, ≥ 10 cartes ([card-data.md](contracts/card-data.md)) ;
- `tests/pick.test.js` — « Nouvelle partie » ne retire pas la carte courante.

Pour (re)calculer les minimums lors de l'ajout de cartes : `node tools/rate-cards.js`.

## 2. Lancer le jeu

```bash
npx serve .        # ou VS Code « Live Server »
```

Ouvrir l'URL affichée (ex. `http://localhost:3000`). Attendu : plateau jouable en
moins de 2 s (SC-001).

## 3. Scénarios manuels

| # | Scénario | Résultat attendu | Réf. |
|---|----------|------------------|------|
| 1 | Ouvrir la page | Plateau 6x6, X sur la 3e rangée, sortie visible à droite | US1-1 |
| 2 | Glisser un véhicule horizontal à la souris, en diagonale | Il ne bouge qu'horizontalement, se cale sur une case | US1-2/3 |
| 3 | Glisser vite un véhicule vers un obstacle lointain | Il s'arrête avant le premier obstacle | US1-4, cas limites |
| 4 | Pousser un véhicule contre un bord / X vers la gauche | Il reste dans le plateau | US1-5 |
| 5 | Tab jusqu'à un véhicule, flèches dans l'axe et hors axe | 1 case par appui dans l'axe ; rien hors axe ; focus bien visible | US1-8 |
| 6 | Résoudre la carte | X atteint les colonnes 5-6, sort en glissant, « Bravo ! » s'affiche ; plus aucun déplacement possible | US1-6/7 |
| 7 | Déplacer des véhicules puis « Recommencer » ; puis gagner, fermer le message (Échap) et « Recommencer » | Même carte, positions initiales ; après victoire, la carte résolue est rejouable | US2-4/5 |
| 8 | « Nouvelle partie » (plusieurs fois rapidement, et pendant un glissement) | Carte différente, propre, pas d'état mélangé | US2-1/2, cas limites |
| 9 | Après victoire, « Rejouer » | Nouvelle carte différente, jouable | US3 |
| 10 | Refaire 2, 6 et 8 **au doigt seul** (téléphone) et **au clavier seul** | Tout fonctionne | SC-007 |

## 4. Responsive et application mobile

1. Outils de développement → mode appareil : 320×568, 390×844, tablette, paysage.
   Attendu : plateau carré entièrement visible, aucun défilement horizontal, contrôles
   accessibles ; tourner l'écran en cours de partie conserve les positions.
2. Chrome/Edge sur ordinateur : icône « Installer » dans la barre d'adresse → l'app
   s'ouvre dans sa propre fenêtre. Lighthouse › PWA : installable.
3. Téléphone (via une URL `https`, p. ex. un déploiement statique ou un tunnel) :
   Android « Ajouter à l'écran d'accueil » / iOS Safari « Partager › Sur l'écran
   d'accueil ». Attendu : lancement plein écran avec l'icône du jeu.
4. Hors ligne : charger une fois, couper le réseau (DevTools › Network › Offline),
   recharger. Attendu : le jeu se charge et reste jouable.
