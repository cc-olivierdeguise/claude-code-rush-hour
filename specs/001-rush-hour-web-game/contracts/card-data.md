# Contrat : format des cartes de défi

Fichier : `src/data/cards.js` — module ES qui exporte **uniquement des données**
(principe III : cartes stockées comme données, pas comme code).

```js
export const CARDS = [
  {
    id: "E01",
    difficulty: "easy",
    minMoves: 3,
    grid: [
      "AA...O",
      "P..Q.O",
      "PXXQ.O",
      "P..Q..",
      "B...CC",
      "B.RRR.",
    ],
  },
  // …
];
```

(L'exemple illustre le format ; ses valeurs `difficulty`/`minMoves` seront fixées par
le solveur.)

## Règles

| Règle | Détail |
|-------|--------|
| Caractères | `.` (vide), `X`, `A`–`K`, `O`–`R` uniquement. |
| Dimensions | 6 chaînes de 6 caractères. |
| Voiture rouge | `X`, horizontale, ligne d'index 2, colonne de tête < 4. |
| Longueurs | 2 cases pour `X`/`A`–`K`, 3 cases pour `O`–`R`. |
| Forme | Chaque lettre = un segment contigu horizontal ou vertical, présent une seule fois. |
| Identifiant | `id` unique ; convention `E##` (facile) / `M##` (moyen). |
| Difficulté | `easy` ⇔ `minMoves` 2–4 ; `medium` ⇔ `minMoves` 5–10. |
| Exactitude | `minMoves` = `solve(card).minMoves` (vérifié par `tests/cards.test.js`). |
| Volume | ≥ 10 cartes, mélange de `easy` et `medium`. |

Toute violation fait échouer `npm test`.
