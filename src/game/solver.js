// Solveur BFS (principe III) : un coup = un véhicule glissé d'une distance
// quelconque dans une direction ; le coup final de X vers la sortie est compté.

import { newGame, getMoveRange, isWon } from "./board.js";

/** @typedef {{ id: string, delta: number }} Move */

function keyOf(game) {
  return game.vehicles.map((v) => `${v.id}${v.row}${v.col}`).join("");
}

/**
 * Nombre minimal de coups pour faire sortir X, et un chemin optimal.
 * @param {import("./board.js").Card} card
 * @param {number} [maxDepth]
 * @returns {{ minMoves: number, path: Move[] } | null}
 */
export function solve(card, maxDepth = 20) {
  const start = newGame(card);
  /** @type {Map<string, { parent: string|null, move: Move|null }>} */
  const visited = new Map([[keyOf(start), { parent: null, move: null }]]);
  let frontier = [start];

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const next = [];
    for (const game of frontier) {
      const parentKey = keyOf(game);
      for (let index = 0; index < game.vehicles.length; index++) {
        const v = game.vehicles[index];
        // La plage vient du domaine ; le successeur est construit directement
        // (équivalent à moveVehicle dans cette plage, sans recalculer la grille).
        const { min, max } = getMoveRange(game, v.id);
        for (let delta = min; delta <= max; delta++) {
          if (delta === 0) continue;
          const vehicles = game.vehicles.slice();
          vehicles[index] =
            v.orientation === "H" ? { ...v, col: v.col + delta } : { ...v, row: v.row + delta };
          const moved = { ...game, vehicles };
          const key = keyOf(moved);
          if (visited.has(key)) continue;
          visited.set(key, { parent: parentKey, move: { id: v.id, delta } });
          if (isWon(moved)) return { minMoves: depth, path: pathTo(visited, key) };
          next.push(moved);
        }
      }
    }
    frontier = next;
  }
  return null;
}

function pathTo(visited, key) {
  const path = [];
  for (let node = visited.get(key); node.move; node = visited.get(node.parent)) {
    path.unshift(node.move);
  }
  return path;
}
