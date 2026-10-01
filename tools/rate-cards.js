// Outil de développement : calcule le nombre minimal de coups de chaque carte
// et signale toute carte invalide, insoluble ou mal notée.
// Usage : node tools/rate-cards.js

import { CARDS } from "../src/data/cards.js";
import { parseCard } from "../src/game/board.js";
import { solve } from "../src/game/solver.js";
import { difficultyFor } from "../src/game/cards.js";

let problems = 0;

for (const card of CARDS) {
  const issues = [];
  let computed = null;
  try {
    parseCard(card);
    const result = solve(card);
    if (!result) issues.push("INSOLUBLE");
    else computed = result.minMoves;
  } catch (err) {
    issues.push(`INVALIDE (${err.message})`);
  }

  const level = computed === null ? null : difficultyFor(computed);
  if (computed === 1) issues.push("se résout en 1 coup");
  if (computed !== null && computed > 10) issues.push("plus de 10 coups");
  if (computed !== null && card.minMoves !== computed) {
    issues.push(`minMoves stocké ${card.minMoves} ≠ calculé ${computed}`);
  }
  if (level && card.difficulty !== level) {
    issues.push(`difficulté stockée « ${card.difficulty} » ≠ « ${level} »`);
  }

  problems += issues.length;
  const status = issues.length ? `  ⚠ ${issues.join(" ; ")}` : "  ok";
  console.log(`${card.id}  minMoves=${computed ?? "-"}  ${level ?? "-"}${status}`);
}

console.log(`\n${CARDS.length} cartes, ${problems} problème(s).`);
process.exitCode = problems ? 1 : 0;
