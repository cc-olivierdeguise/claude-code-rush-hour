// Point d'entrée : état de la partie, contrôles, dialogue de victoire, service worker.
// L'état de jeu ne change qu'à travers l'API du domaine (newGame, moveVehicle).

import { CARDS } from "./data/cards.js";
import { newGame, moveVehicle } from "./game/board.js";
import { pickCard } from "./game/cards.js";
import { renderBoard, setDisabled, playExit } from "./ui/render.js";
import { attachInput, cancelDrag } from "./ui/input.js";

const boardEl = document.getElementById("board");
const winDialog = document.getElementById("win-dialog");
const btnNew = document.getElementById("btn-new");
const btnRestart = document.getElementById("btn-restart");
const btnReplay = document.getElementById("btn-replay");

/** @type {import("./game/board.js").Card} */
let card;
/** @type {import("./game/board.js").Game} */
let game;
// Incrémenté à chaque partie : une animation tardive de la partie précédente est ignorée.
let gameToken = 0;

function startGame(nextCard) {
  gameToken++;
  card = nextCard;
  game = newGame(card);
  renderBoard(boardEl, game, { fresh: true });
  setDisabled(boardEl, false);
}

function onMove(id, delta) {
  const next = moveVehicle(game, id, delta);
  if (next === game) return;
  game = next;
  renderBoard(boardEl, game);
  if (game.status === "won") handleWin();
}

async function handleWin() {
  setDisabled(boardEl, true);
  const token = gameToken;
  await playExit(boardEl);
  if (token === gameToken && !winDialog.open) winDialog.showModal();
}

function resetUi() {
  cancelDrag();
  if (winDialog.open) winDialog.close();
}

function startNewCard() {
  resetUi();
  startGame(pickCard(CARDS, card.id));
}

btnNew.addEventListener("click", startNewCard);

btnRestart.addEventListener("click", () => {
  resetUi();
  startGame(card);
});

btnReplay.addEventListener("click", () => {
  startNewCard();
  boardEl.querySelector(".vehicle")?.focus();
});

// Échap : on ferme le message, la partie gagnée reste figée ;
// « Nouvelle partie » et « Recommencer » restent les issues.
winDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  winDialog.close();
  btnNew.focus();
});

attachInput(boardEl, { getGame: () => game, onMove });
startGame(pickCard(CARDS));

// PWA : installation et jeu hors ligne (le jeu reste jouable sans service worker).
const secure =
  location.protocol === "https:" ||
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";
if ("serviceWorker" in navigator && secure) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
