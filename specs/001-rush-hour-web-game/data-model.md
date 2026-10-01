# Modèle de données : Jeu Rush Hour sur le web

**Feature**: `001-rush-hour-web-game` | **Date**: 2026-10-01

Aucune base de données : toutes les entités vivent en mémoire dans le navigateur. Les
cartes de défi sont des données statiques (`src/data/cards.js`). Rien n'est persisté
(pas de `localStorage` dans cette feature). Toutes les structures d'état sont traitées
comme **immuables** : chaque déplacement produit un nouvel objet.

Conventions : lignes et colonnes indexées à partir de **0** ; `(0,0)` = coin haut-gauche.
La rangée de sortie est `EXIT_ROW = 2` (3e rangée) ; la sortie est à droite de la
colonne 5.

---

## Card (carte de défi) — donnée statique

| Champ | Type | Règles |
|-------|------|--------|
| `id` | `string` | Unique dans l'ensemble (ex. `"E01"`, `"M07"`). |
| `difficulty` | `"easy" \| "medium"` | `easy` ⇔ `minMoves` ∈ [2,4] ; `medium` ⇔ `minMoves` ∈ [5,10]. |
| `minMoves` | `number` | Égal au minimum calculé par le solveur (coup de sortie de X compté). |
| `grid` | `string[6]` | 6 chaînes de 6 caractères parmi `.` `X` `A`–`K` `O`–`R`. |

**Validation** (fonction `parseCard`, testée ; contrat : [card-data.md](contracts/card-data.md)) :

- exactement 6 lignes de 6 caractères, caractères autorisés uniquement ;
- `X` présent, horizontal, sur la ligne `EXIT_ROW`, et pas déjà en colonne 4 ;
- chaque lettre forme un segment contigu sur une seule ligne ou une seule colonne ;
- longueur = 2 pour `X`, `A`–`K` ; 3 pour `O`, `P`, `Q`, `R` ;
- chaque lettre apparaît au plus une fois comme véhicule (pas de doublon).

Le chevauchement est impossible par construction (une case = un caractère).

## Vehicle (véhicule)

| Champ | Type | Règles |
|-------|------|--------|
| `id` | `string` (1 lettre) | `X`, `A`–`K`, `O`–`R`. |
| `orientation` | `"H" \| "V"` | Déduite de la grille. |
| `length` | `2 \| 3` | Déduite de la lettre (camion si `O`–`R`). |
| `row` | `0..5` | Ligne de la case de tête (case la plus haute/gauche). |
| `col` | `0..5` | Colonne de la case de tête. |

Invariants : `col + length ≤ 6` si `H` ; `row + length ≤ 6` si `V` ; aucun couple de
véhicules ne partage une case. La couleur est dérivée de `id` (table `VEHICLE_COLORS`,
couche UI) et n'est pas stockée dans l'état.

## Game (partie)

| Champ | Type | Description |
|-------|------|-------------|
| `cardId` | `string` | Carte en cours (utilisée par « Recommencer » et l'exclusion de « Nouvelle partie »). |
| `vehicles` | `Vehicle[]` | Positions actuelles. |
| `status` | `"playing" \| "won"` | Statut. |

### Transitions d'état

```text
            newGame(card)                      moveVehicle → X.col === 4
 (aucune) ───────────────▶ playing ──────────────────────────────────────▶ won
                            │  ▲                                              │
     moveVehicle (autre) ───┘  │ restart(card) / newGame(autreCarte)          │
                               └──────────────────────────────────────────────┘
```

- `playing` + déplacement légal sans victoire → `playing` (nouvelles positions).
- `playing` + déplacement amenant X à la colonne 4 → `won` (FR-016).
- `won` + tout déplacement → état inchangé (FR-018).
- `restart` (FR-024) et `newGame` (FR-022) créent un nouvel état `playing` depuis une
  carte ; aucun état précédent n'est conservé.

## Plateau (Board) — constantes

| Constante | Valeur |
|-----------|--------|
| `BOARD_SIZE` | `6` |
| `EXIT_ROW` | `2` |
| `WIN_COL` | `4` (X occupe les colonnes 4 et 5) |

## État d'interface (non-domaine, `src/ui/`)

Éphémère, jamais transmis au domaine :

- `drag` : `{ vehicleId, pointerId, startX/Y, range: {min,max}, offset }` ou `null`.
  Remis à `null` par « Nouvelle partie » / « Recommencer » (cas limites du spec).
- `gameToken` : compteur incrémenté à chaque nouvelle partie, pour ignorer une
  animation ou un événement tardif de la partie précédente.
