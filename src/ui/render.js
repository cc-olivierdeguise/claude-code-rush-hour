// Rendu du plateau : un <button> par véhicule, positionné par variables CSS.

import { TRUCK_IDS } from "../game/board.js";
import { VEHICLE_COLORS } from "./colors.js";

const EXIT_FALLBACK_MS = 600;

function labelFor(v) {
  const kind = TRUCK_IDS.includes(v.id) ? "Camion" : "Voiture";
  const color = VEHICLE_COLORS[v.id].name;
  const axis = v.orientation === "H" ? "horizontale" : "verticale";
  return `${kind} ${v.id}, ${color}, ${axis}`;
}

function createButton(id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "vehicle";
  button.dataset.id = id;
  const letter = document.createElement("span");
  letter.textContent = id;
  button.append(letter);
  return button;
}

/**
 * Crée ou met à jour les boutons-véhicules pour refléter `game`.
 * `fresh` (nouvelle partie / recommencer) repart de boutons neufs : aucun
 * glissement, décalage ou animation de la partie précédente ne subsiste.
 * @param {HTMLElement} boardEl
 * @param {import("../game/board.js").Game} game
 * @param {{ fresh?: boolean }} [options]
 */
export function renderBoard(boardEl, game, { fresh = false } = {}) {
  if (fresh) boardEl.querySelectorAll(".vehicle").forEach((el) => el.remove());

  const existing = new Map(
    [...boardEl.querySelectorAll(".vehicle")].map((el) => [el.dataset.id, el]),
  );
  let previous = boardEl.querySelector(".exit");

  for (const v of game.vehicles) {
    const button = existing.get(v.id) ?? createButton(v.id);
    existing.delete(v.id);

    const { bg, fg } = VEHICLE_COLORS[v.id];
    button.classList.toggle("h", v.orientation === "H");
    button.classList.toggle("v", v.orientation === "V");
    button.classList.remove("dragging");
    button.dataset.len = String(v.length);
    button.setAttribute("aria-label", labelFor(v));
    button.style.setProperty("--row", String(v.row));
    button.style.setProperty("--col", String(v.col));
    button.style.setProperty("--len", String(v.length));
    button.style.setProperty("--bg", bg);
    button.style.setProperty("--fg", fg);
    button.style.setProperty("--dx", "0");
    button.style.setProperty("--dy", "0");

    // Ordre DOM = ordre de tabulation (X d'abord). On ne déplace un nœud que si
    // nécessaire, pour ne pas lui faire perdre le focus.
    if (previous.nextElementSibling !== button) previous.after(button);
    previous = button;
  }

  for (const stale of existing.values()) stale.remove();
}

/**
 * Active ou désactive (FR-018) tous les véhicules, en les gardant focalisables.
 * @param {HTMLElement} boardEl
 * @param {boolean} disabled
 */
export function setDisabled(boardEl, disabled) {
  for (const el of boardEl.querySelectorAll(".vehicle")) {
    if (disabled) el.setAttribute("aria-disabled", "true");
    else el.removeAttribute("aria-disabled");
  }
}

/**
 * Fait sortir la voiture rouge par la sortie ; résolue à la fin de l'animation.
 * @param {HTMLElement} boardEl
 * @returns {Promise<void>}
 */
export function playExit(boardEl) {
  const x = boardEl.querySelector('.vehicle[data-id="X"]');
  if (!x) return Promise.resolve();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      x.removeEventListener("transitionend", onEnd);
      resolve();
    };
    const onEnd = (event) => {
      if (event.target === x && event.propertyName === "transform") finish();
    };

    // Laisse d'abord le véhicule finir de glisser jusqu'à la colonne 5-6.
    requestAnimationFrame(() => {
      x.classList.add("exiting");
      if (reduced) return finish();
      x.addEventListener("transitionend", onEnd);
      setTimeout(finish, EXIT_FALLBACK_MS);
    });
  });
}
