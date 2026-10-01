import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickCard, difficultyFor } from "../src/game/cards.js";
import { CARDS } from "../src/data/cards.js";

const DECK = ["C1", "C2", "C3", "C4"].map((id) => ({ id }));
const RANDOMS = [0, 0.25, 0.5, 0.75, 0.999999];

describe("pickCard", () => {
  it("ne renvoie jamais la carte exclue quand il y en a plusieurs", () => {
    for (const exclude of DECK) {
      for (const r of RANDOMS) {
        const picked = pickCard(DECK, exclude.id, () => r);
        assert.notEqual(picked.id, exclude.id);
        assert.ok(DECK.includes(picked));
      }
    }
  });

  it("atteint chacune des cartes restantes (tirage uniforme)", () => {
    const n = DECK.length - 1;
    const seen = new Set();
    for (let k = 0; k < n; k++) seen.add(pickCard(DECK, "C2", () => k / n).id);
    assert.deepEqual([...seen].sort(), ["C1", "C3", "C4"]);
  });

  it("renvoie l'unique carte même si elle est exclue", () => {
    const only = [{ id: "S1" }];
    assert.equal(pickCard(only, "S1", () => 0.7), only[0]);
  });

  it("tire parmi toutes les cartes si excludeId est absent ou inconnu", () => {
    const n = DECK.length;
    for (const exclude of [undefined, "??"]) {
      const seen = new Set();
      for (let k = 0; k < n; k++) seen.add(pickCard(DECK, exclude, () => k / n).id);
      assert.equal(seen.size, n);
    }
  });

  it("lève une Error si la liste est vide", () => {
    assert.throws(() => pickCard([], undefined, () => 0), Error);
  });

  it("100 « Nouvelle partie » successives donnent toujours une carte différente", () => {
    let s = 2026;
    const random = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    let current = pickCard(CARDS, undefined, random);
    for (let i = 0; i < 100; i++) {
      const next = pickCard(CARDS, current.id, random);
      assert.notEqual(next.id, current.id);
      current = next;
    }
  });
});

describe("difficultyFor", () => {
  it("classe Facile (2–4) / Moyen (5–10) et rejette le reste", () => {
    assert.equal(difficultyFor(0), null);
    assert.equal(difficultyFor(1), null);
    for (const n of [2, 3, 4]) assert.equal(difficultyFor(n), "easy");
    for (let n = 5; n <= 10; n++) assert.equal(difficultyFor(n), "medium");
    assert.equal(difficultyFor(11), null);
  });
});
