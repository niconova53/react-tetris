# AGENTS.md – Technical Specification for React Tetris

## 1. Game Board
- **Dimensions**: 10 columns × 20 rows (COLS = 10, ROWS = 20).
- **Cell type**: `number` – `0` = empty, `1‑7` = tetromino ID.
- **Representation**: `type Board = number[][];` (rows first, then columns).

## 2. Tetrominoes
- **IDs & Colors (Nintendo palette)**:
  - `1` – I – Cyan   `#00f0f0`
  - `2` – J – Blue   `#0000f0`
  - `3` – L – Orange `#f08000`
  - `4` – O – Yellow `#f0f000`
  - `5` – S – Green  `#00f000`
  - `6` – T – Purple `#a000f0`
  - `7` – Z – Red    `#f00000`
- **Shapes**: defined as 4×4 matrices (`0/1`).
- **Rotation System**: **Super Rotation System (SRS)** with wall‑kick tables for each piece (I uses its own table, O never rotates). Rotation is clockwise; counter‑clockwise can be achieved by three clockwise steps.

## 3. Core Mechanics
- **Gravity**: automatic soft‑drop every `dropInterval` ms. Starts at 800 ms, decreases per Nintendo level‑timing table.
- **Soft‑Drop**: Arrow Down – move piece down one cell per press (does not accelerate gravity).
- **Hard‑Drop**: Space – piece instantly falls to the lowest valid position, merges, clears lines, spawns next piece.
- **Lock Delay**: 500 ms after a piece contacts the floor or another piece. Any successful move/rotate during this window resets the timer.
- **Next Piece Preview**: Show the upcoming tetromino.
- **Hold**: Press **C** (or configurable key) to store the current piece and replace it with the held piece. Hold can be used once per spawn.
- **Line Clear**: Remove fully filled rows, shift above rows down.
- **Scoring (Nintendo)** (multiplied by current level):
  - 1 line = 100 × level
  - 2 lines = 300 × level
  - 3 lines = 500 × level
  - 4 lines (Tetris) = 800 × level
- **Level**: Starts at 1. Increases by 1 every **10 total lines cleared**. Gravity interval updates according to the official Nintendo timing table.
- **Game Over**: Trigger when a newly spawned piece collides at its initial position.

## 4. UI Elements
- **Board** – renders current board with falling piece merged for display.
- **Next Piece** – preview of the next tetromino.
- **Hold** – slot for stored piece with indicator whether hold is available.
- **Score / Level** display.
- **Game Over overlay** – clear message with final score.

## 5. Architecture (React + Vite + TypeScript)
- **Folder layout**:
```
src/
 ├─ components/
 │   ├─ Board.tsx
 │   ├─ Next.tsx
 │   ├─ Hold.tsx
 │   └─ Controls.tsx (optional)
 ├─ game.ts        // pure game logic, no React
 ├─ App.tsx        // top‑level UI & state management
 └─ index.tsx
```
- **State management**: use `useState` for immutable state (`board`, `piece`, `nextPiece`, `holdPiece`, `score`, `level`, `linesCleared`, `gameOver`). Use `useRef` to keep mutable refs (`boardRef`, `pieceRef`, etc.) for stable keyboard callbacks.
- **Timers**: one interval for gravity, one timeout for lock‑delay.
- **Keyboard handling** attached once on mount; callbacks read refs to avoid stale closures.

## 6. Testing (Vitest)
- File: `src/__tests__/game.test.ts`.
- Tests required:
  1. `rotatePiece` follows SRS including wall‑kick offsets for each piece type.
  2. `collide` correctly detects collisions with walls, floor, and existing blocks.
  3. `clearLines` returns correct cleared line count and board state.
  4. Scoring function correctly computes points for 1‑4 lines at varying levels.
  5. Level progression after every 10 cleared lines.
  6. Hold functionality swaps pieces correctly and respects the once‑per‑spawn limit.
- All tests must pass (`npm test`).

## 7. Build & Verification
- `npm run build` must complete without TypeScript errors.
- `npm test` must succeed.
- Running `npm run dev` should launch a fully playable Tetris matching the classic behaviour described.

---
**All points in this document are mandatory.** Any deviation (missing hold, wrong lock‑delay, no SRS wall‑kicks, etc.) will be considered incomplete.
