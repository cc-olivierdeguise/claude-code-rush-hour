// Domaine pur du plateau Rush Hour (principe I) : aucun accès au DOM, aux timers,
// au stockage ni au réseau. Les fonctions ne modifient jamais leurs arguments.

/**
 * @typedef {Object} Card
 * @property {string} id                       ex. "E01", "M07"
 * @property {"easy"|"medium"} difficulty
 * @property {number} minMoves                 minimum calculé par le solveur
 * @property {string[]} grid                   6 chaînes de 6 caractères
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} id                       "X", "A"–"K", "O"–"R"
 * @property {"H"|"V"} orientation
 * @property {2|3} length
 * @property {number} row                      ligne de la case de tête (0..5)
 * @property {number} col                      colonne de la case de tête (0..5)
 */

/**
 * @typedef {Object} Game
 * @property {string} cardId
 * @property {Vehicle[]} vehicles
 * @property {"playing"|"won"} status
 */

export const BOARD_SIZE = 6;
export const EXIT_ROW = 2;
export const WIN_COL = 4;
export const TRUCK_IDS = Object.freeze(["O", "P", "Q", "R"]);

const ALLOWED = /^[.XA-KO-R]$/;

/**
 * Convertit la grille d'une carte en véhicules triés par id (X d'abord).
 * Lève une Error explicite si la carte viole une règle de validation.
 * @param {Card} card
 * @returns {Vehicle[]}
 */
export function parseCard(card) {
  const fail = (msg) => {
    throw new Error(`Carte ${card.id} : ${msg}`);
  };
  const { grid } = card;

  if (!Array.isArray(grid) || grid.length !== BOARD_SIZE) {
    fail(`la grille doit avoir ${BOARD_SIZE} lignes`);
  }

  /** @type {Map<string, Array<[number, number]>>} */
  const cells = new Map();
  grid.forEach((line, row) => {
    if (typeof line !== "string" || line.length !== BOARD_SIZE) {
      fail(`la ligne ${row} doit avoir ${BOARD_SIZE} caractères`);
    }
    [...line].forEach((ch, col) => {
      if (!ALLOWED.test(ch)) fail(`caractère interdit « ${ch} » en ligne ${row}`);
      if (ch === ".") return;
      if (!cells.has(ch)) cells.set(ch, []);
      cells.get(ch).push([row, col]);
    });
  });

  if (!cells.has("X")) fail("la voiture rouge X est absente");

  const vehicles = [];
  for (const [id, list] of cells) {
    const expected = TRUCK_IDS.includes(id) ? 3 : 2;
    if (list.length !== expected) {
      fail(`le véhicule ${id} doit occuper ${expected} cases (trouvé ${list.length})`);
    }
    const sameRow = list.every(([r]) => r === list[0][0]);
    const sameCol = list.every(([, c]) => c === list[0][1]);
    if (!sameRow && !sameCol) fail(`le véhicule ${id} n'est pas en ligne droite`);

    const orientation = sameRow ? "H" : "V";
    const positions = list.map(([r, c]) => (orientation === "H" ? c : r));
    const first = Math.min(...positions);
    if (Math.max(...positions) - first !== expected - 1) {
      fail(`le véhicule ${id} n'est pas contigu (ou apparaît deux fois)`);
    }
    const row = orientation === "H" ? list[0][0] : first;
    const col = orientation === "H" ? first : list[0][1];
    vehicles.push({ id, orientation, length: expected, row, col });
  }

  const x = vehicles.find((v) => v.id === "X");
  if (x.orientation !== "H") fail("la voiture rouge X doit être horizontale");
  if (x.row !== EXIT_ROW) fail(`la voiture rouge X doit être sur la ligne ${EXIT_ROW}`);
  if (x.col >= WIN_COL) fail("la voiture rouge X est déjà devant la sortie");

  return vehicles.sort(byId);
}

function byId(a, b) {
  if (a.id === "X") return -1;
  if (b.id === "X") return 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Grille 6x6 des ids de véhicules (null = case vide).
 * @param {Vehicle[]} vehicles
 * @returns {(string|null)[][]}
 */
export function occupancy(vehicles) {
  const grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (const v of vehicles) {
    for (let i = 0; i < v.length; i++) {
      const r = v.row + (v.orientation === "V" ? i : 0);
      const c = v.col + (v.orientation === "H" ? i : 0);
      grid[r][c] = v.id;
    }
  }
  return grid;
}

/**
 * Nouvelle partie (sert aussi à « Recommencer » avec la même carte).
 * @param {Card} card
 * @returns {Game}
 */
export function newGame(card) {
  return { cardId: card.id, vehicles: parseCard(card), status: "playing" };
}

/**
 * Décalages entiers permis le long de l'axe du véhicule (min ≤ 0 ≤ max),
 * bornés par le premier obstacle et les bords du plateau.
 * @param {Game} game
 * @param {string} id
 * @returns {{min: number, max: number}}
 */
export function getMoveRange(game, id) {
  const v = game.vehicles.find((w) => w.id === id);
  if (!v || game.status === "won") return { min: 0, max: 0 };

  // Cases occupées de la seule ligne (ou colonne) du véhicule.
  const horizontal = v.orientation === "H";
  const lane = Array(BOARD_SIZE).fill(false);
  for (const w of game.vehicles) {
    for (let i = 0; i < w.length; i++) {
      const r = w.row + (w.orientation === "V" ? i : 0);
      const c = w.col + (w.orientation === "H" ? i : 0);
      if (horizontal ? r === v.row : c === v.col) lane[horizontal ? c : r] = true;
    }
  }
  const start = horizontal ? v.col : v.row;
  const free = (pos) => !lane[pos];

  let min = 0;
  while (start + min - 1 >= 0 && free(start + min - 1)) min--;
  let max = 0;
  while (start + v.length + max < BOARD_SIZE && free(start + v.length + max)) max++;
  return { min, max };
}

/**
 * Déplace un véhicule de `delta` cases le long de son axe, borné à sa plage permise.
 * Renvoie le même objet si rien ne bouge ou si la partie est gagnée.
 * @param {Game} game
 * @param {string} id
 * @param {number} delta
 * @returns {Game}
 */
export function moveVehicle(game, id, delta) {
  const { min, max } = getMoveRange(game, id);
  const step = Math.max(min, Math.min(max, Math.trunc(delta)));
  if (step === 0) return game;

  const vehicles = game.vehicles.map((v) => {
    if (v.id !== id) return v;
    return v.orientation === "H" ? { ...v, col: v.col + step } : { ...v, row: v.row + step };
  });
  const next = { ...game, vehicles };
  return isWon(next) ? { ...next, status: "won" } : next;
}

/**
 * Vrai si la voiture rouge X occupe les deux cases contre la sortie.
 * @param {Game} game
 * @returns {boolean}
 */
export function isWon(game) {
  const x = game.vehicles.find((v) => v.id === "X");
  return x !== undefined && x.col === WIN_COL;
}
