# Contrat : API publique du module domaine

Modules : `src/game/board.js`, `src/game/solver.js`, `src/game/cards.js`.
Pur JavaScript (ES modules) : **aucun** accès au DOM, aux timers, au stockage ni au
réseau (principe I). Toutes les fonctions sont déterministes et ne modifient jamais
leurs arguments. Types : voir [data-model.md](../data-model.md).

## `src/game/board.js`

| Fonction | Signature | Comportement |
|----------|-----------|--------------|
| `parseCard` | `(card: Card) → Vehicle[]` | Convertit la grille en véhicules. Lève une `Error` au message explicite si la carte viole une règle de validation. |
| `newGame` | `(card: Card) → Game` | `{ cardId: card.id, vehicles: parseCard(card), status: "playing" }`. Sert aussi à « Recommencer » (même carte). |
| `getMoveRange` | `(game: Game, id: string) → { min: number, max: number }` | Décalages entiers permis le long de l'axe (`min ≤ 0 ≤ max`). Borné par le premier obstacle et les bords. `{0,0}` si `status === "won"` ou id inconnu. |
| `moveVehicle` | `(game: Game, id: string, delta: number) → Game` | Déplace le véhicule de `delta` cases le long de son axe, **borné** à `getMoveRange` (s'arrête contre l'obstacle, FR-011/FR-014). Renvoie **le même objet** si le déplacement effectif est 0 ou si la partie est gagnée. Passe `status` à `"won"` si X atteint `WIN_COL`. |
| `isWon` | `(game: Game) → boolean` | `true` ssi X est en colonne `WIN_COL`. |
| `occupancy` | `(vehicles: Vehicle[]) → (string\|null)[][]` | Grille 6x6 des ids (utilitaire, utilisé par le solveur et les tests). |

Constantes exportées : `BOARD_SIZE`, `EXIT_ROW`, `WIN_COL`, `TRUCK_IDS`.

Garanties testées (SC-003, SC-004) :

- un véhicule `H` ne change jamais de `row`, un `V` jamais de `col` ;
- après tout `moveVehicle`, aucun chevauchement et tous les véhicules dans le plateau ;
- un `delta` supérieur à la distance libre s'arrête juste avant l'obstacle (pas de saut) ;
- X ne peut pas sortir par la gauche ;
- `status` devient `"won"` exactement quand X atteint la colonne 4, jamais autrement ;
- après `"won"`, `moveVehicle` renvoie l'état inchangé.

## `src/game/solver.js`

| Fonction | Signature | Comportement |
|----------|-----------|--------------|
| `solve` | `(card: Card, maxDepth = 20) → { minMoves: number, path: Move[] } \| null` | BFS ; un coup = `{ id, delta }` (distance quelconque, une direction). `minMoves` inclut le coup final de X. `null` si insoluble dans `maxDepth`. |

## `src/game/cards.js`

| Fonction | Signature | Comportement |
|----------|-----------|--------------|
| `pickCard` | `(cards: Card[], excludeId?: string, random = Math.random) → Card` | Tirage uniforme parmi `cards` sauf `excludeId` ; si une seule carte, la renvoie. Lève une `Error` si `cards` est vide. |
| `difficultyFor` | `(minMoves: number) → "easy" \| "medium" \| null` | `easy` pour 2–4, `medium` pour 5–10, `null` sinon. |
