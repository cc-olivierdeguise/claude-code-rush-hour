// Code couleur officiel de l'édition standard (principe VI).
// `fg` = couleur de la lettre, contraste ≥ 4.5:1 avec `bg` ; `name` sert à l'aria-label.

/** @type {Record<string, { bg: string, fg: string, name: string }>} */
export const VEHICLE_COLORS = {
  X: { bg: "#d32f2f", fg: "#ffffff", name: "rouge" },
  A: { bg: "#9ccc65", fg: "#1b1b1b", name: "vert clair" },
  B: { bg: "#fb8c00", fg: "#1b1b1b", name: "orange" },
  C: { bg: "#4fc3f7", fg: "#1b1b1b", name: "bleu clair" },
  D: { bg: "#f48fb1", fg: "#1b1b1b", name: "rose" },
  E: { bg: "#3949ab", fg: "#ffffff", name: "bleu foncé" },
  F: { bg: "#2e7d32", fg: "#ffffff", name: "vert foncé" },
  G: { bg: "#b0bec5", fg: "#1b1b1b", name: "gris argent" },
  H: { bg: "#e6d3a3", fg: "#1b1b1b", name: "beige" },
  I: { bg: "#fdd835", fg: "#1b1b1b", name: "jaune" },
  J: { bg: "#795548", fg: "#ffffff", name: "marron" },
  K: { bg: "#827717", fg: "#ffffff", name: "olive" },
  O: { bg: "#fbc02d", fg: "#1b1b1b", name: "jaune" },
  P: { bg: "#7b1fa2", fg: "#ffffff", name: "violet" },
  Q: { bg: "#1565c0", fg: "#ffffff", name: "bleu" },
  R: { bg: "#00796b", fg: "#ffffff", name: "turquoise" },
};
