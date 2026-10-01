import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BOARD_SIZE,
  EXIT_ROW,
  WIN_COL,
  TRUCK_IDS,
  parseCard,
  occupancy,
  newGame,
  getMoveRange,
  moveVehicle,
  isWon,
} from "../src/game/board.js";

/** Construit une carte de test à partir d'une grille. */
function card(grid, id = "T01") {
  return { id, difficulty: "easy", minMoves: 2, grid };
}

const SAMPLE = card([
  "AA...O",
  "P..Q.O",
  "PXXQ.O",
  "P..Q..",
  "B...CC",
  "B.RRR.",
]);

/** Remplace la ligne `row` d'une grille vide (avec X valide) par `line`. */
function withX(lines) {
  const grid = ["......", "......", "XX....", "......", "......", "......"];
  for (const [row, line] of Object.entries(lines)) grid[row] = line;
  return card(grid, "BAD");
}

describe("parseCard", () => {
  it("exporte les constantes du plateau", () => {
    assert.equal(BOARD_SIZE, 6);
    assert.equal(EXIT_ROW, 2);
    assert.equal(WIN_COL, 4);
    assert.deepEqual([...TRUCK_IDS].sort(), ["O", "P", "Q", "R"]);
  });

  it("convertit une grille valide en véhicules (case de tête, triés, X d'abord)", () => {
    assert.deepEqual(parseCard(SAMPLE), [
      { id: "X", orientation: "H", length: 2, row: 2, col: 1 },
      { id: "A", orientation: "H", length: 2, row: 0, col: 0 },
      { id: "B", orientation: "V", length: 2, row: 4, col: 0 },
      { id: "C", orientation: "H", length: 2, row: 4, col: 4 },
      { id: "O", orientation: "V", length: 3, row: 0, col: 5 },
      { id: "P", orientation: "V", length: 3, row: 1, col: 0 },
      { id: "Q", orientation: "V", length: 3, row: 1, col: 3 },
      { id: "R", orientation: "H", length: 3, row: 5, col: 2 },
    ]);
  });

  const invalid = {
    "moins de 6 lignes": card(["......", "......", "XX....", "......", "......"]),
    "plus de 6 lignes": card(["......", "......", "XX....", "......", "......", "......", "......"]),
    "ligne de longueur ≠ 6": withX({ 0: "....." }),
    "caractère interdit (Z)": withX({ 0: "Z....." }),
    "caractère interdit (L)": withX({ 0: "LL...." }),
    "X absent": card(["......", "......", "......", "......", "......", "......"]),
    "X vertical": card(["......", ".X....", ".X....", "......", "......", "......"]),
    "X hors de la ligne de sortie": card(["XX....", "......", "......", "......", "......", "......"]),
    "X déjà en colonne 4": card(["......", "......", "....XX", "......", "......", "......"]),
    "lettre non contiguë": withX({ 0: "A.A..." }),
    "lettre en forme de L": withX({ 0: "AA....", 1: "A....." }),
    "voiture de longueur 3": withX({ 0: "AAA..." }),
    "voiture de longueur 1": withX({ 0: "A....." }),
    "X de longueur 3": card(["......", "......", "XXX...", "......", "......", "......"]),
    "camion de longueur 2": withX({ 0: "OO...." }),
    "camion de longueur 4": withX({ 0: "PPPP.." }),
    "même lettre en deux segments": withX({ 0: "AA..AA" }),
    "même lettre en deux segments (vertical)": withX({ 0: "B.....", 1: "B.....", 3: "B.....", 4: "B....." }),
  };

  for (const [name, bad] of Object.entries(invalid)) {
    it(`lève une Error explicite : ${name}`, () => {
      assert.throws(() => parseCard(bad), (err) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, new RegExp(bad.id));
        return true;
      });
    });
  }

  it("mentionne la lettre fautive dans le message", () => {
    assert.throws(() => parseCard(withX({ 0: "OO...." })), /O/);
    assert.throws(() => parseCard(withX({ 0: "A.A..." })), /A/);
  });
});

describe("occupancy / newGame", () => {
  it("occupancy renvoie une grille 6x6 d'ids ou null", () => {
    const grid = occupancy(parseCard(SAMPLE));
    assert.equal(grid.length, 6);
    for (const row of grid) assert.equal(row.length, 6);
    const asText = grid.map((row) => row.map((c) => c ?? ".").join(""));
    assert.deepEqual(asText, SAMPLE.grid);
  });

  it("newGame crée une partie en cours depuis la carte", () => {
    assert.deepEqual(newGame(SAMPLE), {
      cardId: "T01",
      vehicles: parseCard(SAMPLE),
      status: "playing",
    });
  });

  it("newGame est déterministe et ne modifie pas la carte", () => {
    const snapshot = structuredClone(SAMPLE);
    const a = newGame(SAMPLE);
    const b = newGame(SAMPLE);
    assert.deepEqual(a, b);
    assert.notEqual(a, b);
    assert.deepEqual(SAMPLE, snapshot);
  });

  it("Recommencer : newGame ne dépend que de la carte et renvoie toujours « playing »", () => {
    assert.equal(newGame.length, 1);
    assert.equal(newGame(SAMPLE).status, "playing");
  });
});

/** Générateur pseudo-aléatoire déterministe (LCG). */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function find(game, id) {
  return game.vehicles.find((v) => v.id === id);
}

/** Vérifie qu'aucun véhicule ne déborde ni ne chevauche un autre. */
function assertValidBoard(vehicles) {
  const seen = new Set();
  for (const v of vehicles) {
    for (let i = 0; i < v.length; i++) {
      const r = v.row + (v.orientation === "V" ? i : 0);
      const c = v.col + (v.orientation === "H" ? i : 0);
      assert.ok(r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE, `${v.id} hors du plateau`);
      const key = `${r},${c}`;
      assert.ok(!seen.has(key), `chevauchement en ${key}`);
      seen.add(key);
    }
  }
}

// Carte de travail : A (H) libre sur sa ligne, B (V) au-dessus de D,
// C (H) entre D et E, X coincé entre B et Q (camion vertical), R bloqué à droite par E.
const MOVES = card([
  "..AA..",
  "B...Q.",
  "BXX.Q.",
  "....Q.",
  "D.CC.E",
  "D.RRRE",
]);

// Rangée de sortie dégagée : X peut gagner en un coup.
const OPEN = card([
  "......",
  "..A...",
  "XXA...",
  "......",
  "......",
  "......",
]);

describe("getMoveRange / moveVehicle / isWon", () => {
  it("(a) véhicule horizontal libre entre deux bords", () => {
    const g = newGame(card(["......", "......", "XX....", "..AA..", "......", "......"]));
    assert.deepEqual(getMoveRange(g, "A"), { min: -2, max: 2 });
  });

  it("(b) plage bornée par le premier obstacle de chaque côté", () => {
    const g = newGame(MOVES);
    assert.deepEqual(getMoveRange(g, "C"), { min: -1, max: 1 });
    assert.deepEqual(getMoveRange(g, "X"), { min: 0, max: 1 });
    assert.deepEqual(getMoveRange(g, "Q"), { min: -1, max: 1 });
    assert.deepEqual(getMoveRange(g, "B"), { min: -1, max: 1 });
    assert.deepEqual(getMoveRange(g, "R"), { min: -1, max: 0 });
  });

  it("(c) {0,0} pour un id inconnu ou une partie gagnée", () => {
    const g = newGame(MOVES);
    assert.deepEqual(getMoveRange(g, "K"), { min: 0, max: 0 });
    const won = { ...g, status: "won" };
    assert.deepEqual(getMoveRange(won, "C"), { min: 0, max: 0 });
  });

  it("(d) min ≤ 0 ≤ max pour chaque véhicule", () => {
    const g = newGame(MOVES);
    for (const v of g.vehicles) {
      const { min, max } = getMoveRange(g, v.id);
      assert.ok(min <= 0 && max >= 0, `${v.id} : ${min}..${max}`);
    }
  });

  it("(e) un véhicule ne quitte jamais son axe", () => {
    let g = newGame(MOVES);
    g = moveVehicle(g, "A", -2);
    assert.equal(find(g, "A").row, 0);
    assert.equal(find(g, "A").col, 0);
    g = moveVehicle(g, "B", 1);
    assert.equal(find(g, "B").col, 0);
    assert.equal(find(g, "B").row, 2);
  });

  it("(f) un delta trop grand s'arrête avant l'obstacle sans sauter", () => {
    const g = moveVehicle(newGame(MOVES), "X", 5);
    assert.equal(find(g, "X").col, 2);
    const q = moveVehicle(newGame(MOVES), "Q", 4);
    assert.equal(find(q, "Q").row, 2); // arrêté juste au-dessus de R
    assert.equal(find(moveVehicle(newGame(MOVES), "C", 10), "C").col, 3);
  });

  it("(g) un véhicule poussé contre un bord reste dans le plateau", () => {
    const g = moveVehicle(newGame(MOVES), "A", 10);
    assert.equal(find(g, "A").col, 4);
    const up = moveVehicle(newGame(MOVES), "B", -10);
    assert.equal(find(up, "B").row, 0);
  });

  it("(h) X ne peut pas sortir par la gauche", () => {
    const start = newGame(card(["......", "......", "..XX..", "......", "......", "......"]));
    const g = moveVehicle(start, "X", -10);
    assert.equal(find(g, "X").col, 0);
    assert.equal(g.status, "playing");
    assert.equal(moveVehicle(g, "X", -1), g);
  });

  it("(i) un déplacement effectif nul renvoie le même objet", () => {
    const g = newGame(MOVES);
    assert.equal(moveVehicle(g, "R", 2), g);
    assert.equal(moveVehicle(g, "X", -1), g);
    assert.equal(moveVehicle(g, "A", 0), g);
    assert.equal(moveVehicle(g, "K", 1), g);
  });

  it("(j) un déplacement légal renvoie un nouvel état sans modifier l'ancien", () => {
    const g = newGame(MOVES);
    const snapshot = structuredClone(g);
    const next = moveVehicle(g, "C", 1);
    assert.notEqual(next, g);
    assert.equal(find(next, "C").col, 3);
    assert.deepEqual(g, snapshot);
  });

  it("(k) aucune suite de coups ne crée de chevauchement ni de débordement", () => {
    const random = lcg(42);
    let g = newGame(MOVES);
    for (let step = 0; step < 300; step++) {
      const v = g.vehicles[Math.floor(random() * g.vehicles.length)];
      g = moveVehicle(g, v.id, Math.floor(random() * 11) - 5);
      assertValidBoard(g.vehicles);
      for (const orig of newGame(MOVES).vehicles) {
        const now = find(g, orig.id);
        if (orig.orientation === "H") assert.equal(now.row, orig.row);
        else assert.equal(now.col, orig.col);
      }
    }
  });

  it("(l) la victoire survient exactement quand X atteint la colonne 4", () => {
    let g = newGame(OPEN);
    assert.equal(isWon(g), false);
    assert.equal(moveVehicle(g, "X", 4), g); // bloqué par A : la partie continue
    g = moveVehicle(g, "A", -1);
    assert.equal(g.status, "playing");
    g = moveVehicle(g, "X", 2);
    assert.equal(find(g, "X").col, 2);
    assert.equal(g.status, "playing");
    assert.equal(isWon(g), false);
    g = moveVehicle(g, "X", 1);
    assert.equal(g.status, "playing");
    g = moveVehicle(g, "X", 1);
    assert.equal(find(g, "X").col, WIN_COL);
    assert.equal(g.status, "won");
    assert.equal(isWon(g), true);
  });

  it("(m) après la victoire, plus aucun déplacement n'est accepté", () => {
    let g = moveVehicle(newGame(OPEN), "A", -1);
    g = moveVehicle(g, "X", 10);
    assert.equal(g.status, "won");
    for (const v of g.vehicles) {
      assert.equal(moveVehicle(g, v.id, 1), g);
      assert.equal(moveVehicle(g, v.id, -1), g);
    }
  });

  it("(n) Recommencer après des déplacements restaure l'état initial", () => {
    const initial = newGame(MOVES);
    let g = moveVehicle(initial, "C", 1);
    g = moveVehicle(g, "A", -2);
    const before = structuredClone(g);
    const restarted = newGame(MOVES);
    assert.deepEqual(restarted, initial);
    assert.equal(restarted.status, "playing");
    assert.deepEqual(g, before);
  });

  it("(o) Recommencer après une victoire permet de rejouer", () => {
    let g = moveVehicle(newGame(OPEN), "A", -1);
    g = moveVehicle(g, "X", 10);
    assert.equal(g.status, "won");
    const restarted = newGame(OPEN);
    assert.equal(restarted.status, "playing");
    const next = moveVehicle(restarted, "A", 1);
    assert.notEqual(next, restarted);
  });
});
