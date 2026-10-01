# Rush Hour

Version web du casse-tête **Rush Hour** (édition standard) : fais glisser les voitures
et les camions pour libérer le passage et faire sortir la **voiture rouge** du parking.

- Une seule page, jouable à la **souris**, au **doigt** et au **clavier**.
- Pensé pour les enfants : libellés courts en français, lettre sur chaque véhicule,
  aucun message d'erreur (un coup impossible ne se produit simplement pas).
- **16 cartes de défi** (6 faciles, 10 moyennes), toutes vérifiées par un solveur.
- **Application installable** (PWA) sur téléphone, tablette ou ordinateur, et
  **jouable hors ligne** après le premier chargement.
- HTML, CSS et JavaScript natifs : aucun framework, aucune dépendance, aucune étape
  de build, aucun compte et aucune donnée collectée.

---

## Jouer

### Le but

Le plateau fait 6 × 6 cases. La sortie se trouve sur le bord droit de la 3ᵉ rangée,
signalée par une flèche rouge. Déplace les autres véhicules pour dégager la rangée,
puis amène la voiture rouge **X** contre la sortie : elle s'en va toute seule et
« **Bravo !** » s'affiche.

### Les règles

- Un véhicule horizontal ne bouge que de gauche à droite ; un véhicule vertical,
  que de haut en bas.
- Un véhicule ne traverse jamais un autre véhicule et ne sort jamais du plateau
  (sauf la voiture rouge, par la sortie).
- Les voitures font 2 cases, les camions (O, P, Q, R) en font 3.

### Les commandes

| Avec…      | Comment déplacer un véhicule |
|------------|------------------------------|
| la souris  | Clique sur un véhicule et fais-le glisser le long de son axe. Au relâchement, il se cale sur la case la plus proche. |
| le doigt   | Pose le doigt sur un véhicule et fais-le glisser. |
| le clavier | `Tab` / `Maj+Tab` pour choisir un véhicule (un contour jaune l'entoure), puis les **flèches** dans son axe : une case par appui. |

### Les boutons

| Bouton             | Effet |
|--------------------|-------|
| **Nouvelle partie** | Tire une autre carte au hasard (jamais la même deux fois de suite). |
| **Recommencer**     | Remet la carte en cours dans sa position de départ, y compris après une victoire. |
| **Rejouer**         | Dans le message « Bravo ! » : lance une nouvelle carte. |

`Échap` ferme le message de victoire sans changer de carte. Le plateau reste figé :
utilise ensuite « Nouvelle partie » ou « Recommencer ».

---

## Lancer le jeu

Le jeu utilise des modules JavaScript : il doit être servi par un **serveur de
fichiers statiques**. Un double-clic sur `index.html` (`file://`) ne fonctionne pas.

```bash
npx serve .
```

Ouvre ensuite l'adresse affichée (par exemple `http://localhost:3000`).
Autre possibilité : l'extension VS Code **Live Server** (« Open with Live Server » sur
`index.html`).

### Installer comme application

Le service worker n'est actif qu'en `https://` ou sur `localhost`.

- **Ordinateur (Chrome / Edge)** : icône « Installer » dans la barre d'adresse.
- **Android** : menu du navigateur › « Ajouter à l'écran d'accueil ».
- **iPhone / iPad (Safari)** : bouton Partager › « Sur l'écran d'accueil ».

Pour un téléphone, publie le dossier sur un hébergement statique en HTTPS
(GitHub Pages, Netlify, etc.) : tous les fichiers sont statiques et il n'y a rien à
compiler.

Après une première visite, le jeu se recharge et se joue sans connexion.

---

## Développement

Prérequis : **Node.js 20 ou plus**, utilisé seulement pour les tests et les outils.
Le jeu lui-même n'en dépend pas.

### Tests

```bash
npm test
```

Les tests (`node:test`, aucune dépendance) couvrent :

- `tests/board.test.js` : validation des cartes, déplacements (axe, obstacles,
  bords, pas de saut), victoire, plateau figé après victoire, « Recommencer » ;
- `tests/solver.test.js` : solveur BFS (nombre minimal de coups, cartes insolubles) ;
- `tests/cards.test.js` : chaque carte livrée est valide, résoluble, et notée avec
  le bon nombre minimal de coups et la bonne difficulté ;
- `tests/pick.test.js` : tirage aléatoire sans répéter la carte en cours.

Toute modification d'une règle de jeu doit s'accompagner du test correspondant,
écrit en premier.

### Ajouter ou modifier une carte

Les cartes sont des **données** dans `src/data/cards.js` : 6 lignes de 6 caractères.

```js
{
  id: "M11",            // E## = facile, M## = moyen
  difficulty: "medium", // easy : 2 à 4 coups ; medium : 5 à 10 coups
  minMoves: 7,          // nombre minimal de coups, sortie de X comprise
  grid: [
    "AA...O",
    "P..Q.O",
    "PXXQ.O",           // X toujours sur la 3e ligne (index 2)
    "P..Q..",
    "B...CC",
    "B.RRR.",
  ],
}
```

- `.` = case vide, `X` = voiture rouge, `A`–`K` = voitures (2 cases),
  `O`–`R` = camions (3 cases).
- Calcule ensuite le nombre minimal de coups et la difficulté :

  ```bash
  node tools/rate-cards.js
  ```

  Le script affiche le résultat de chaque carte et signale toute carte invalide,
  insoluble, trop facile (1 coup), trop difficile (plus de 10 coups) ou mal notée.
- Reporte `minMoves` et `difficulty`, puis relance `npm test`.

### Publier une nouvelle version

Le service worker garde les fichiers en cache. Après avoir modifié un fichier du jeu,
incrémente le nom du cache dans `sw.js` (`rush-hour-v1` → `rush-hour-v2`) pour que
les joueurs reçoivent la mise à jour. Pour régénérer les icônes :
`node tools/make-icons.js`.

### Structure

```text
index.html             Page unique : plateau, boutons, message de victoire
manifest.webmanifest   Description de l'application installable
sw.js                  Service worker (cache hors ligne)
icons/                 Icônes de l'application (générées)
src/
  game/                Règles du jeu, sans accès au navigateur (testées en Node)
    board.js           Lecture des cartes, déplacements, victoire
    solver.js          Solveur BFS (nombre minimal de coups)
    cards.js           Tirage aléatoire, calcul de la difficulté
  data/cards.js        Les cartes de défi
  ui/                  Affichage et commandes (navigateur)
    render.js          Véhicules, désactivation, animation de sortie
    input.js           Glisser au pointeur et flèches du clavier
    colors.js          Couleurs officielles des véhicules
  app.js               Point d'entrée : état de la partie et boutons
  styles.css           Mise en page responsive et animations
tests/                 Tests automatisés
tools/                 Outils de développement (notation des cartes, icônes)
specs/                 Spécification, plan et tâches de la fonctionnalité
```

Les règles (`src/game/`) ne dépendent jamais de l'interface : l'interface modifie
l'état de la partie uniquement via `newGame` et `moveVehicle`.

---

Rush Hour® est une marque de ThinkFun. Ce projet d'apprentissage utilise des dessins
originaux et n'est pas affilié à ThinkFun.
