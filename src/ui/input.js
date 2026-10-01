// Entrées joueur : glisser au pointeur (souris, doigt, stylet) et flèches du clavier.
// Le domaine reste la seule source de vérité : pendant le glissement, le décalage
// est borné à getMoveRange ; au relâchement, moveVehicle applique le coup.

import { BOARD_SIZE, getMoveRange } from "../game/board.js";

/**
 * @typedef {Object} Drag
 * @property {string} vehicleId
 * @property {number} pointerId
 * @property {number} startX
 * @property {number} startY
 * @property {{min: number, max: number}} range
 * @property {number} offset          décalage courant, en cases fractionnaires
 * @property {HTMLElement} el
 */

/** @type {Drag|null} */
let drag = null;

const KEY_DELTAS = {
  H: { ArrowLeft: -1, ArrowRight: 1 },
  V: { ArrowUp: -1, ArrowDown: 1 },
};
const ARROWS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

function axisOf(el) {
  return el.classList.contains("h") ? "H" : "V";
}

function isDisabled(el) {
  return el.getAttribute("aria-disabled") === "true";
}

function setOffset(el, offset) {
  el.style.setProperty(axisOf(el) === "H" ? "--dx" : "--dy", String(offset));
}

/**
 * Abandonne le glissement en cours sans appliquer de coup (Nouvelle partie / Recommencer).
 */
export function cancelDrag() {
  if (!drag) return;
  const { el, pointerId } = drag;
  drag = null;
  if (el.hasPointerCapture?.(pointerId)) el.releasePointerCapture(pointerId);
  el.classList.remove("dragging");
  setOffset(el, 0);
}

/**
 * Branche les gestionnaires d'entrée sur le plateau.
 * @param {HTMLElement} boardEl
 * @param {{ getGame: () => import("../game/board.js").Game, onMove: (id: string, delta: number) => void }} handlers
 */
export function attachInput(boardEl, { getGame, onMove }) {
  boardEl.addEventListener("pointerdown", (event) => {
    const el = event.target.closest(".vehicle");
    if (!el || drag || isDisabled(el)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const range = getMoveRange(getGame(), el.dataset.id);
    el.setPointerCapture(event.pointerId);
    el.classList.add("dragging");
    drag = {
      vehicleId: el.dataset.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      range,
      offset: 0,
      el,
    };
  });

  boardEl.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const cellPx = boardEl.clientWidth / BOARD_SIZE;
    // Projection sur l'axe du véhicule uniquement (FR-010).
    const px = axisOf(drag.el) === "H" ? event.clientX - drag.startX : event.clientY - drag.startY;
    const { min, max } = drag.range;
    drag.offset = Math.max(min, Math.min(max, px / cellPx));
    setOffset(drag.el, drag.offset);
  });

  const release = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { el, vehicleId, offset } = drag;
    const delta = Math.round(offset); // calage sur la case entière la plus proche (FR-013)
    drag = null;
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    el.classList.remove("dragging");
    setOffset(el, 0);
    if (delta !== 0) onMove(vehicleId, delta);
  };
  boardEl.addEventListener("pointerup", release);
  boardEl.addEventListener("pointercancel", release);

  boardEl.addEventListener("keydown", (event) => {
    const el = event.target.closest?.(".vehicle");
    if (!el || !ARROWS.has(event.key)) return;
    event.preventDefault(); // pas de défilement de la page
    if (drag || isDisabled(el)) return;
    const delta = KEY_DELTAS[axisOf(el)][event.key];
    if (delta) onMove(el.dataset.id, delta); // le domaine borne : rien si bloqué (FR-014)
  });
}
