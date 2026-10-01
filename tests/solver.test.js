import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { solve } from "../src/game/solver.js";
import { newGame, moveVehicle } from "../src/game/board.js";

function card(grid) {
  return { id: "S01", difficulty: "easy", minMoves: 2, grid };
}

const FREE_PATH = card(["......", "......", "XX....", "......", "......", "......"]);
const ONE_BLOCKER = card(["......", "...A..", "XX.A..", "......", "......", "......"]);
const UNSOLVABLE = card(["DDEEFF", "...O..", "XX.O..", "...O..", "AABBCC", "......"]);

describe("solve", () => {
  it("chemin libre : un seul coup de X jusqu'à la sortie", () => {
    assert.deepEqual(solve(FREE_PATH), { minMoves: 1, path: [{ id: "X", delta: 4 }] });
  });

  it("un véhicule vertical bloque la rangée : 2 coups", () => {
    assert.equal(solve(ONE_BLOCKER).minMoves, 2);
  });

  it("renvoie null pour une carte insoluble", () => {
    assert.equal(solve(UNSOLVABLE), null);
  });

  it("rejouer le chemin mène à la victoire en exactement minMoves coups", () => {
    for (const c of [FREE_PATH, ONE_BLOCKER]) {
      const { minMoves, path } = solve(c);
      assert.equal(path.length, minMoves);
      let game = newGame(c);
      for (const { id, delta } of path) {
        const next = moveVehicle(game, id, delta);
        assert.notEqual(next, game, "chaque coup du chemin doit être effectif");
        game = next;
      }
      assert.equal(game.status, "won");
    }
  });

  it("ne modifie pas la carte", () => {
    const snapshot = structuredClone(ONE_BLOCKER);
    solve(ONE_BLOCKER);
    assert.deepEqual(ONE_BLOCKER, snapshot);
  });
});
