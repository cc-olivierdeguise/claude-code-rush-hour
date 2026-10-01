<!--
Sync Impact Report
- Version change: 1.2.0 → 2.0.0
- Modified principles:
  - III. Every Shipped Puzzle Is Solvable and Rated: difficulty levels redefined.
    Beginner (≤15 moves) / Intermediate (16–25) → Easy (2–4 moves) / Medium (5–10).
    Cards with 1 move or more than 10 moves are no longer allowed. The minimum move
    count explicitly includes the red car's final exit move. Stored difficulty must
    match the solver's result.
- Added sections: none
- Removed sections: none
- Deferred TODOs: none
-->

# Rush Hour Constitution

## Core Principles

### I. Pure, Deterministic Game Logic

Board state, vehicle movement, collision detection and win detection MUST live in a
domain module with no dependency on rendering, input handling, timers or storage.
Given the same board and the same move, the result MUST always be the same.
UI code MUST change game state only through this module's public API.

Rationale: logic kept apart from the UI can be tested in isolation, reused by the
solver, and kept when the UI is rewritten.

### II. Test-First for Game Rules (NON-NEGOTIABLE)

Every game rule (legal moves, blocking, board bounds, win condition, undo/reset)
MUST have an automated test that is written and seen failing before the rule is
implemented. A change that alters rule behavior without a corresponding test change
MUST NOT be merged.

Rationale: puzzle rules are small and exact; a silent rule regression breaks every
level at once.

### III. Every Shipped Puzzle Is Solvable and Rated

Every challenge card included in the game MUST be verified solvable by an automated
solver in the test suite. Challenge cards MUST be stored as data (not code), and each
MUST record its difficulty level and its minimum move count as computed by that
solver.

A move is one vehicle slid any distance in one direction. The minimum move count is
the fewest moves needed to get the red car (X) out of the board, counting the red
car's own final exit move.

Only **Easy** (facile) and **Medium** (moyen) cards MAY ship:

- **Easy**: minimum move count from 2 to 4.
- **Medium**: minimum move count from 5 to 10.

A card that can be solved in a single move, or whose minimum exceeds 10 moves, MUST
NOT ship. The difficulty stored with a card MUST match the range of its
solver-computed minimum; a mismatch MUST fail the test suite. Harder levels
(Advanced, Expert) are out of scope.

Rationale: an unsolvable or mislabeled level is the most damaging bug a puzzle game
can ship, and the audience is children, so difficulty must stay within reach and be
checked by a machine rather than by eye.

### IV. Simplicity First

Build only what the current spec requires (YAGNI). New dependencies, abstraction
layers or configuration options MUST be justified in the plan's Complexity Tracking
table. When two designs both meet the spec, choose the one with fewer moving parts.

Rationale: this is a small, learning-oriented project; added complexity costs more
than it returns.

### V. Child-Friendly, Accessible, Responsive Play

The primary audience is children. The game MUST be fully playable with mouse, touch
and keyboard alone, and MUST NOT require reading beyond short labels to play.
Vehicles MUST be distinguishable by more than color alone (e.g. their letter). Each
move MUST give visible feedback within 100 ms on a typical laptop or tablet. Illegal
moves MUST simply not happen (the vehicle stops at the obstacle) rather than produce
an error message.

Rationale: a puzzle that a young player cannot operate, read or tell apart is not
playable for them.

### VI. Faithful to the Regular Edition

The game MUST reproduce the regular (standard) edition of Rush Hour, as described in
`/game-rules/game_instruction.pdf`, `/game-rules/game-instruction-2.pdf` and
https://en.wikipedia.org/wiki/Rush_Hour_(puzzle):

- The board is a **6x6** grid. The only exit is on the right edge of the third row
  from the top, aligned with the red car's lane.
- **Cars occupy exactly 2 cells; trucks occupy exactly 3 cells.** Every vehicle is
  1 cell wide and is placed horizontally or vertically.
- A vehicle MUST only slide forward or backward along its own axis, never sideways,
  never rotated, never lifted over another vehicle, and never outside the board
  (except the red car leaving through the exit).
- The puzzle is won when the red car (X) slides through the exit.
- The vehicle set is the official one: red car **X**; 11 cars **A–K**; 4 trucks
  **O, P, Q, R**. Each vehicle MUST use the color from the edition's color code
  (X red, A light green, B orange, C light blue, D pink, E dark blue/violet,
  F dark green, G silver/gray, H beige, I yellow, J brown, K olive; O yellow truck,
  P purple truck, Q blue truck, R teal truck).
- Other editions (Junior, Deluxe, Rush Hour Jr., Safari, extra vehicles, other board
  sizes) are out of scope.

Rationale: the user asked for the regular edition specifically; fixing the geometry
and vehicle set up front keeps every spec, puzzle and test consistent.

## Technical Constraints

### Platform

- The product is a **web application** that runs in a current desktop or mobile
  browser.
- **Technology stack**: HTML, CSS and plain JavaScript (ES modules) only. No UI
  framework and no build step (bundler, transpiler) MAY be introduced without a
  justification in the plan's Complexity Tracking table.
- **No backend and no database**: the game MUST be delivered as static files and run
  entirely in the browser. Challenge cards MUST ship as static data files (e.g.
  JavaScript or JSON) alongside the code. Any player progress MAY only be kept in
  browser storage (`localStorage`), and the game MUST remain fully playable if that
  storage is empty or unavailable.
- Launching the game locally MUST need nothing more than opening `index.html` through
  a static file server (e.g. `npx serve` or the VS Code Live Server extension).
- The automated test runner (Principles II and III) MAY be a development-only tool
  (e.g. Node's built-in `node:test`); it MUST NOT become a runtime dependency of the
  game.
- No account, login or network call is required to play; the game MUST work offline
  once loaded.
- No telemetry or third-party tracking MAY be added without a constitution amendment.

### Game Scope

- In scope: regular-edition rules (Principle VI), a set of Easy and Medium
  challenge cards (Principle III), card selection, reset of the current card, and a
  win screen.
- Out of scope unless a later amendment adds them: cards above 10 moves, other
  editions, a level editor, multiplayer, accounts and online leaderboards.
- Vehicle artwork MUST be original drawings that follow the color code; the
  ThinkFun logo and product artwork MUST NOT be copied into the application.

## Development Workflow

- Features follow the Spec Kit flow: `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`.
- Each plan MUST include a Constitution Check that maps the design to Principles I–VI
  and lists any justified exceptions.
- Work happens on a feature branch; `main` MUST stay in a buildable, all-tests-passing
  state.
- A change is mergeable only when the full test suite passes, including the solver
  and difficulty checks from Principle III.

## Governance

This constitution supersedes other project practices where they conflict.

- **Amendments**: proposed as a change to this file, with a Sync Impact Report
  describing what changed and why, and reviewed before merge.
- **Versioning**: semantic versioning. MAJOR for removing or redefining a principle;
  MINOR for adding a principle or section or materially expanding guidance; PATCH for
  wording and clarifications.
- **Compliance**: every plan's Constitution Check and every code review MUST verify
  adherence. Exceptions MUST be recorded with justification in the plan's Complexity
  Tracking table.

**Version**: 2.0.0 | **Ratified**: 2026-10-01 | **Last Amended**: 2026-10-01
