# Contrat : interface utilisateur (page unique + PWA)

## Structure de la page (`index.html`, `lang="fr"`)

| Élément | Rôle / attributs | Exigences |
|---------|------------------|-----------|
| `<h1>` | « Rush Hour » | Titre court. |
| `#board` | `role="group"`, `aria-label="Plateau de jeu"` | Carré 6x6, sortie visible à droite de la 3e rangée (FR-002). |
| `.vehicle` (un par véhicule) | `<button>` ; `aria-label="Voiture X, rouge, horizontale"` / « Camion O… » ; `data-id` | Lettre visible (FR-005) ; couleur officielle ; `touch-action: none`. Désactivés (`disabled` ou `aria-disabled`) quand la partie est gagnée (FR-018). |
| `#btn-new` | `<button>` « Nouvelle partie » | Toujours visible et actif (FR-020). |
| `#btn-restart` | `<button>` « Recommencer » | Toujours visible et actif, y compris après une victoire (rejoue alors la carte résolue) (FR-024). |
| `#win-dialog` | `<dialog>` modal | « Bravo ! » + élément de fête ; bouton « Rejouer » focalisé à l'ouverture (FR-017, FR-019). |

## Interactions

| Entrée | Effet |
|--------|-------|
| Pointeur (souris/doigt/stylet) appuyé sur un véhicule puis glissé | Le véhicule suit le pointeur **uniquement le long de son axe**, borné par `getMoveRange` ; retour visuel immédiat (< 100 ms, FR-015). |
| Relâchement / `pointercancel` | Arrondi à la case entière la plus proche dans la plage permise, puis `moveVehicle` (FR-013). |
| Tab / Maj+Tab | Focus de véhicule en véhicule, puis contrôles ; anneau de focus épais et contrasté (FR-009). |
| Flèche dans l'axe du véhicule focalisé | `moveVehicle(±1)` ; sans effet si bloqué (FR-014). |
| Flèche hors axe | Ignorée (le défilement de page est empêché). |
| « Nouvelle partie » | Abandonne le glissement, ferme le dialogue, `newGame(pickCard(CARDS, cardId))` (FR-021, FR-022). |
| « Recommencer » | Abandonne le glissement, ferme le dialogue s'il est ouvert, `newGame(carteCourante)` sans confirmation, en cours de partie comme après une victoire (FR-024). |
| « Rejouer » (dialogue) | Identique à « Nouvelle partie ». |

## Victoire

1. `status` passe à `"won"` → véhicules désactivés.
2. X glisse hors du plateau par la sortie (transition CSS ~400 ms ; instantanée si
   `prefers-reduced-motion: reduce`).
3. Ouverture du `<dialog>` de succès.

## Responsive et mode application

- Le plateau est carré et occupe le plus grand espace disponible ; en paysage, les
  contrôles se placent à côté. Aucun défilement horizontal, du téléphone (320 px de
  large) à l'ordinateur.
- Positions des véhicules en pourcentages → la rotation/redimensionnement ne change
  pas l'état (cas limite du spec).
- Cibles tactiles ≥ 44 px pour les boutons ; texte des boutons ≥ 18 px.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
  zones sûres respectées ; pas de zoom double-tap ni de sélection de texte sur le plateau.
- **PWA** : `manifest.webmanifest` (`name`, `short_name`, `start_url: "./"`,
  `display: "standalone"`, `background_color`, `theme_color`, icônes 192/512 dont une
  `maskable`) ; `sw.js` pré-cache tous les fichiers statiques → installable et jouable
  hors ligne. Balises `apple-touch-icon` et `theme-color` pour iOS.
