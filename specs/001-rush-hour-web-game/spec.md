# Feature Specification: Jeu Rush Hour sur le web

**Feature Branch**: `001-rush-hour-web-game`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Créer une version web du jeu Rush Hour centrée uniquement sur l'expérience de jeu : une seule page avec le plateau, une configuration valide et solvable tirée au hasard, déplacement des véhicules selon les règles classiques, détection de la sortie de la voiture rouge, message de succès, et possibilité de démarrer une nouvelle partie à tout moment. Pas de comptes, classement, multijoueur ni historique."

## Clarifications

### Session 2026-10-01

- Q: À quel moment exact la partie est-elle gagnée ? → A: Dès que la voiture rouge atteint les deux cases de droite de sa rangée (contre la sortie) ; elle glisse ensuite automatiquement hors du plateau par une courte animation.
- Q: Comment le joueur déplace-t-il un véhicule au clavier seul ? → A: Tab / Maj+Tab donne le focus à un véhicule (indicateur visible) ; chaque appui sur une flèche dans l'axe du véhicule le déplace d'une case, en s'arrêtant contre les obstacles.
- Q: Faut-il un bouton « Recommencer » remettant la configuration en cours dans son état initial, en plus de « Nouvelle partie » ? → A: Oui, ajouter un contrôle « Recommencer ».
- Q: « Recommencer » est-il disponible après une victoire ? → A: Oui, il reste actif à tout moment ; après une victoire, il réaffiche la carte qui vient d'être résolue dans son état initial (même comportement qu'en cours de partie).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jouer une partie jusqu'à la victoire (Priority: P1)

Le joueur ouvre la page du jeu. Un plateau 6x6 s'affiche immédiatement avec la voiture rouge et plusieurs autres véhicules placés selon une configuration tirée au hasard parmi les configurations prédéfinies. Le joueur fait glisser les véhicules, un par un, le long de leur axe pour dégager le chemin de la voiture rouge. Lorsque la voiture rouge glisse à travers la sortie située sur le bord droit de sa rangée, la partie est gagnée et un message de succès clair et festif apparaît.

**Why this priority**: c'est le cœur du jeu. Sans plateau jouable, règles de déplacement et victoire, il n'y a pas de produit.

**Independent Test**: ouvrir la page, résoudre la configuration affichée en déplaçant les véhicules, et constater l'apparition du message de succès lorsque la voiture rouge sort.

**Acceptance Scenarios**:

1. **Given** la page n'est pas encore ouverte, **When** le joueur ouvre la page, **Then** un plateau 6x6 s'affiche avec la voiture rouge sur la troisième rangée à partir du haut, la sortie visible sur le bord droit de cette rangée, et les autres véhicules placés selon une configuration prédéfinie.
2. **Given** un véhicule horizontal avec des cases libres à sa gauche ou à sa droite, **When** le joueur le fait glisser horizontalement, **Then** il avance case par case dans cette direction et s'arrête sur une case entière.
3. **Given** un véhicule horizontal, **When** le joueur tente de le faire glisser verticalement, **Then** le véhicule ne bouge pas verticalement (l'inverse s'applique aux véhicules verticaux).
4. **Given** un véhicule dont la trajectoire est bloquée par un autre véhicule, **When** le joueur tente de le faire glisser au-delà de l'obstacle, **Then** le véhicule s'arrête juste avant l'obstacle, sans chevaucher ni traverser l'autre véhicule, et sans message d'erreur.
5. **Given** un véhicule (autre que la voiture rouge face à la sortie) placé contre un bord du plateau, **When** le joueur tente de le pousser vers ce bord, **Then** le véhicule reste à l'intérieur du plateau.
6. **Given** le chemin entre la voiture rouge et la sortie est entièrement dégagé, **When** le joueur fait glisser la voiture rouge vers la droite jusqu'aux deux cases contre la sortie, **Then** la partie est gagnée, la voiture rouge glisse automatiquement hors du plateau par la sortie et un message de succès s'affiche.
7. **Given** le message de succès est affiché, **When** le joueur le regarde, **Then** le plateau n'accepte plus de déplacements pour cette partie.
8. **Given** un véhicule a le focus clavier, **When** le joueur appuie sur une flèche dans l'axe du véhicule, **Then** le véhicule avance d'exactement une case dans cette direction si la case est libre, et ne bouge pas sinon.

---

### User Story 2 - Recommencer avec une nouvelle partie à tout moment (Priority: P2)

Le joueur est bloqué ou souhaite simplement changer de défi. Il utilise un contrôle « Nouvelle partie » toujours visible sur la page. Le plateau est entièrement réinitialisé avec une nouvelle configuration tirée au hasard.

**Why this priority**: sans cette option, un joueur bloqué n'a aucune issue autre que recharger la page ; c'est la seconde boucle essentielle de l'expérience.

**Independent Test**: en cours de partie, déplacer quelques véhicules, activer « Nouvelle partie », et vérifier qu'une configuration propre et différente est affichée.

**Acceptance Scenarios**:

1. **Given** une partie en cours avec des véhicules déjà déplacés, **When** le joueur active « Nouvelle partie », **Then** une nouvelle configuration est tirée au hasard et affichée dans son état initial, sans trace des déplacements précédents.
2. **Given** plus d'une configuration est disponible, **When** le joueur active « Nouvelle partie », **Then** la nouvelle configuration est différente de celle qui vient d'être jouée.
3. **Given** une nouvelle partie vient de démarrer, **When** le joueur déplace les véhicules, **Then** toutes les règles de déplacement s'appliquent normalement.
4. **Given** une partie en cours avec des véhicules déjà déplacés, **When** le joueur active « Recommencer », **Then** la même configuration est réaffichée dans son état initial, sans trace des déplacements précédents.
5. **Given** une partie gagnée (message de succès fermé), **When** le joueur active « Recommencer », **Then** la configuration qui vient d'être résolue est réaffichée dans son état initial et les déplacements sont de nouveau acceptés.

---

### User Story 3 - Rejouer après une victoire (Priority: P3)

Après avoir gagné, le joueur voit, dans le message de succès, une action bien visible pour lancer une autre partie. En l'activant, le message disparaît et un nouveau plateau jouable s'affiche.

**Why this priority**: prolonge l'expérience après la victoire ; dépend des stories 1 et 2.

**Independent Test**: gagner une partie, activer l'action proposée dans le message de succès, et vérifier qu'une nouvelle partie jouable démarre.

**Acceptance Scenarios**:

1. **Given** le message de succès est affiché, **When** le joueur active l'action « Rejouer » du message, **Then** le message disparaît et une nouvelle configuration, différente de celle qui vient d'être résolue, s'affiche dans son état initial.
2. **Given** une nouvelle partie démarrée après une victoire, **When** le joueur joue, **Then** les déplacements sont de nouveau acceptés et une nouvelle victoire peut être détectée.

---

### Edge Cases

- Le joueur relâche un véhicule entre deux cases : le véhicule se cale sur la case entière la plus proche permise par les obstacles.
- Le joueur fait glisser rapidement un véhicule vers un obstacle éloigné : le véhicule ne « saute » jamais par-dessus un véhicule intermédiaire.
- Le joueur tente de faire sortir la voiture rouge alors qu'un véhicule bloque encore sa rangée : la voiture rouge s'arrête contre l'obstacle et la partie continue.
- Le joueur tente de pousser la voiture rouge vers la gauche hors du plateau : refusé, seule la sortie de droite permet de quitter le plateau.
- Le joueur active « Nouvelle partie » pendant qu'il fait glisser un véhicule : le glissement est abandonné et le nouveau plateau s'affiche proprement.
- Le joueur active « Nouvelle partie » plusieurs fois de suite rapidement : chaque activation produit un plateau cohérent, sans véhicules superposés ni état mélangé.
- Le joueur active « Recommencer » pendant qu'il fait glisser un véhicule : le glissement est abandonné et la configuration en cours est réaffichée dans son état initial.
- Une seule configuration est disponible : « Nouvelle partie » réaffiche cette configuration dans son état initial.
- Le joueur redimensionne la fenêtre ou tourne sa tablette en cours de partie : le plateau s'adapte sans perdre la position des véhicules.

## Requirements *(mandatory)*

### Functional Requirements

**Page et plateau**

- **FR-001**: Le système MUST présenter une seule page principale contenant le plateau de jeu et les contrôles « Nouvelle partie » et « Recommencer ».
- **FR-002**: Le plateau MUST être une grille de 6x6 cases avec une seule sortie, située sur le bord droit de la troisième rangée à partir du haut, clairement signalée visuellement.
- **FR-003**: Le système MUST afficher la voiture rouge et les autres véhicules exactement aux positions définies par la configuration sélectionnée.
- **FR-004**: Chaque véhicule MUST occuper 1 case de largeur et soit 2 cases (voiture), soit 3 cases (camion), orienté horizontalement ou verticalement, selon le jeu de véhicules de l'édition standard (voiture rouge, voitures A à K, camions O, P, Q, R) et son code de couleurs.
- **FR-005**: Les véhicules MUST être distinguables autrement que par la couleur seule (par exemple par leur lettre).

**Configurations**

- **FR-006**: Le système MUST disposer d'un ensemble de configurations prédéfinies, chacune valide (aucun chevauchement, tous les véhicules dans le plateau, voiture rouge horizontale sur la rangée de la sortie) et ayant au moins une solution.
- **FR-007**: Chaque configuration MUST être de niveau Facile (solution minimale de 2 à 4 déplacements) ou Moyen (5 à 10 déplacements), le déplacement final de sortie de la voiture rouge étant compté.
- **FR-008**: Au chargement de la page, le système MUST sélectionner aléatoirement une configuration dans cet ensemble.

**Déplacements**

- **FR-009**: Le joueur MUST pouvoir déplacer un véhicule directement sur le plateau, à la souris, au toucher et au clavier. Au clavier : Tab / Maj+Tab déplace le focus d'un véhicule à l'autre avec un indicateur de focus bien visible ; chaque appui sur une flèche dans l'axe du véhicule focalisé le déplace d'une seule case (les flèches hors axe sont sans effet).
- **FR-010**: Un véhicule horizontal MUST uniquement se déplacer horizontalement ; un véhicule vertical MUST uniquement se déplacer verticalement.
- **FR-011**: Un véhicule MUST NOT traverser ni chevaucher un autre véhicule ; il s'arrête contre le premier obstacle rencontré.
- **FR-012**: Un véhicule MUST NOT sortir des limites du plateau, à l'exception de la voiture rouge lorsqu'elle franchit la sortie.
- **FR-013**: Un déplacement MUST se terminer avec le véhicule aligné sur des cases entières.
- **FR-014**: Une tentative de déplacement interdit MUST simplement ne pas se produire (le véhicule reste ou s'arrête à la dernière position permise), sans message d'erreur.
- **FR-015**: Chaque déplacement MUST produire un retour visuel perceptible immédiatement (en moins de 100 ms).

**Victoire**

- **FR-016**: Le système MUST détecter que la partie est gagnée dès que la voiture rouge occupe les deux cases les plus à droite de la rangée de la sortie (5e et 6e colonnes), puis animer automatiquement sa sortie du plateau par la sortie ; le joueur n'a pas à la faire glisser au-delà du bord.
- **FR-017**: À la victoire, le système MUST afficher un message de succès clair, festif et lisible par un jeune enfant (court libellé accompagné d'un élément visuel de célébration).
- **FR-018**: Après la victoire, le système MUST empêcher tout autre déplacement sur le plateau de la partie terminée.
- **FR-019**: Le message de succès MUST proposer une action pour démarrer une autre partie.

**Nouvelle partie**

- **FR-020**: Le contrôle « Nouvelle partie » MUST être disponible à tout moment, en cours de partie comme après une victoire.
- **FR-021**: Le démarrage d'une nouvelle partie MUST sélectionner aléatoirement une configuration, différente de celle qui vient d'être jouée lorsque plus d'une configuration existe.
- **FR-022**: Le démarrage d'une nouvelle partie MUST réinitialiser complètement l'état : positions des véhicules issues de la nouvelle configuration, message de succès masqué, déplacements de nouveau acceptés, aucun glissement en cours conservé.
- **FR-024**: Le contrôle « Recommencer » MUST être disponible à tout moment, en cours de partie comme après une victoire, et MUST remettre la configuration en cours (ou celle qui vient d'être résolue) dans son état initial (mêmes véhicules, positions de départ, déplacements de nouveau acceptés), en abandonnant tout glissement en cours, sans demander de confirmation.

**Périmètre**

- **FR-023**: Le système MUST NOT inclure de comptes utilisateurs, d'authentification, de classement, de mode multijoueur, d'historique des parties ni de fonctionnalité non nécessaire au jeu.

### Key Entities

- **Plateau**: grille de 6x6 cases avec une sortie unique sur le bord droit de la troisième rangée.
- **Véhicule**: identifié par une lettre (X pour la voiture rouge), avec une longueur (2 ou 3 cases), une orientation (horizontale ou verticale), une couleur et une position sur le plateau.
- **Configuration (carte de défi)**: disposition initiale de l'ensemble des véhicules, avec son niveau de difficulté (Facile ou Moyen) et son nombre minimal de déplacements pour la résoudre.
- **Partie**: configuration en cours de jeu, positions actuelles des véhicules et statut (en cours ou gagnée).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un joueur voit un plateau jouable en moins de 2 secondes après l'ouverture de la page.
- **SC-002**: 100 % des configurations proposées sont valides et résolubles en 2 à 10 déplacements, vérifiées automatiquement.
- **SC-003**: Dans 100 % des essais, aucun déplacement ne produit un chevauchement, un passage à travers un véhicule, un déplacement hors axe ou une sortie du plateau autre que celle de la voiture rouge par la sortie.
- **SC-004**: Le message de succès apparaît dans 100 % des cas où la voiture rouge atteint les deux cases contre la sortie, et jamais autrement.
- **SC-005**: Le démarrage d'une nouvelle partie affiche un plateau entièrement réinitialisé en moins de 1 seconde, en un seul geste du joueur.
- **SC-006**: Lors de tests avec des enfants, au moins 90 % comprennent comment déplacer un véhicule et comment lancer une nouvelle partie sans explication écrite.
- **SC-007**: Le jeu est entièrement jouable, du chargement à la victoire puis à une nouvelle partie, avec la souris seule, au toucher seul et au clavier seul.

## Assumptions

- Le jeu suit l'édition standard de Rush Hour (plateau 6x6, véhicules et couleurs officiels) conformément à la constitution du projet.
- Le public principal est composé d'enfants ; les libellés sont courts et en français.
- Un « déplacement » correspond à un véhicule glissé d'une distance quelconque dans une seule direction.
- La sélection est purement aléatoire : le joueur ne choisit ni la configuration ni la difficulté ; les configurations Faciles et Moyennes sont mélangées.
- L'ensemble initial comporte au moins une dizaine de configurations, pour que les nouvelles parties restent variées.
- Démarrer une nouvelle partie en cours de jeu ne demande pas de confirmation : c'est le moyen prévu pour abandonner une configuration.
- Aucun compteur de coups, chronomètre, indice ni annulation coup par coup n'est inclus : ils ne sont pas demandés pour l'expérience essentielle.
- Aucune progression n'est enregistrée ; recharger la page démarre simplement une nouvelle partie aléatoire.
- Le jeu fonctionne sans connexion réseau une fois la page chargée, sur un navigateur récent d'ordinateur, de tablette ou de téléphone.
