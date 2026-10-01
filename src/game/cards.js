// Sélection des cartes de défi (domaine pur, aléatoire injecté — principe I).

/**
 * Tire une carte au hasard, différente de `excludeId` quand c'est possible.
 * @param {import("./board.js").Card[]} cards
 * @param {string} [excludeId]
 * @param {() => number} [random]  renvoie un nombre dans [0, 1)
 * @returns {import("./board.js").Card}
 */
export function pickCard(cards, excludeId, random = Math.random) {
  if (cards.length === 0) throw new Error("Aucune carte disponible");
  const pool = cards.length > 1 ? cards.filter((c) => c.id !== excludeId) : cards;
  const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
  return pool[index];
}

/**
 * Difficulté correspondant à un nombre minimal de coups (principe III).
 * @param {number} minMoves
 * @returns {"easy"|"medium"|null}
 */
export function difficultyFor(minMoves) {
  if (minMoves >= 2 && minMoves <= 4) return "easy";
  if (minMoves >= 5 && minMoves <= 10) return "medium";
  return null;
}
