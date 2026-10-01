import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CARDS } from "../src/data/cards.js";
import { BOARD_SIZE, parseCard, newGame, moveVehicle } from "../src/game/board.js";
import { solve } from "../src/game/solver.js";
import { difficultyFor } from "../src/game/cards.js";

/** Générateur pseudo-aléatoire déterministe (LCG). */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
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

describe("cartes de défi (CARDS)", () => {
  it("contient au moins 10 cartes", () => {
    assert.ok(CARDS.length >= 10, `seulement ${CARDS.length} cartes`);
  });

  it("a des ids uniques au format E## (facile) / M## (moyen)", () => {
    const ids = CARDS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const c of CARDS) {
      assert.match(c.id, /^[EM]\d{2}$/);
      assert.equal(c.id[0] === "E", c.difficulty === "easy", `${c.id} : préfixe et difficulté incohérents`);
    }
  });

  it("contient au moins une carte facile et une carte moyenne", () => {
    assert.ok(CARDS.some((c) => c.difficulty === "easy"));
    assert.ok(CARDS.some((c) => c.difficulty === "medium"));
  });

  it("chaque carte est valide, résoluble, et notée selon le solveur (< 5 s)", () => {
    const start = performance.now();
    for (const c of CARDS) {
      assert.doesNotThrow(() => parseCard(c), `${c.id} invalide`);
      const result = solve(c);
      assert.notEqual(result, null, `${c.id} insoluble`);
      assert.equal(c.minMoves, result.minMoves, `${c.id} : minMoves stocké ≠ solveur`);
      assert.equal(c.difficulty, difficultyFor(c.minMoves), `${c.id} : difficulté incohérente`);
    }
    assert.ok(performance.now() - start < 5000, "résolution des cartes trop lente");
  });

  it("aucune séquence de coups ne produit de chevauchement ni de sortie du plateau", () => {
    for (const c of CARDS) {
      const random = lcg(c.id.charCodeAt(1) * 100 + Number(c.id.slice(1)));
      let game = newGame(c);
      for (let step = 0; step < 250; step++) {
        const v = game.vehicles[Math.floor(random() * game.vehicles.length)];
        game = moveVehicle(game, v.id, Math.floor(random() * 11) - 5);
        assertValidBoard(game.vehicles);
      }
    }
  });
});
