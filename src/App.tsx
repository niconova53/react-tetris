// src/App.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  collide,
  mergePiece,
  clearLines,
  rotatePiece,
  movePiece,
  randomPiece,
  emptyBoard,
  isGameOver,
  calculateScoreAgents,
  levelToInterval,
  boardWidth,
  boardHeight,
  PIECE_COLORS,
  trimShape,
} from './game';

type Piece = ReturnType<typeof randomPiece>;

// Board cell size responds to viewport so the whole game always fits,
// never overflows. Base 30px scaled down on short/narrow windows.
function useCellSize(): number {
  const [cell, setCell] = useState(30);
  useEffect(() => {
    const compute = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // Board height must fit within (viewport - stats/panels chrome).
      // ~120px reserved for top stats + paddings; ~180px for side panel width.
      const byHeight = Math.floor((vh - 150) / 20);
      const byWidth = Math.floor((vw - 240) / 10);
      const next = Math.max(14, Math.min(30, byHeight, byWidth));
      setCell(next);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return cell;
}

const PREVIEW_CELL = 22; // px (scaled separately via CSS transform)
const PREVIEW_SIZE = 4; // 4x4 fixed grid

/** Renders a tetromino center-aligned in a fixed 4x4 preview grid. */
const PiecePreview: React.FC<{ piece: Piece | null; dimmed?: boolean }> = ({ piece, dimmed }) => {
  const grid: (number | null)[][] = Array.from({ length: PREVIEW_SIZE }, () =>
    Array(PREVIEW_SIZE).fill(null)
  );

  if (piece) {
    const trimmed = trimShape(piece.shape);
    const h = trimmed.length;
    const w = trimmed[0].length;
    const offsetY = Math.floor((PREVIEW_SIZE - h) / 2);
    const offsetX = Math.floor((PREVIEW_SIZE - w) / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (trimmed[y][x] !== 0) {
          grid[offsetY + y][offsetX + x] = piece.id;
        }
      }
    }
  }

  const color = dimmed ? '#444' : PIECE_COLORS[piece?.id ?? 0];

  return (
    <div className="preview-grid">
      {grid.map((row, y) =>
        row.map((v, x) => (
          <div
            key={`${y}-${x}`}
            className="preview-cell"
            style={{ backgroundColor: v !== null ? color : 'transparent' }}
          />
        ))
      )}
    </div>
  );
};

const App: React.FC = () => {
  const CELL_SIZE = useCellSize();
  const [board, setBoard] = useState<number[][]>(emptyBoard());
  const [piece, setPiece] = useState<Piece | null>(null);
  const [next, setNext] = useState<Piece>(() => randomPiece());
  const [hold, setHold] = useState<Piece | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  // Mutable refs so timers & key handlers always see the latest state.
  const boardRef = useRef(board);
  const pieceRef = useRef<Piece | null>(null);
  const nextRef = useRef(next);
  const holdRef = useRef<Piece | null>(null);
  const canHoldRef = useRef(true);
  const levelRef = useRef(level);
  const linesRef = useRef(0);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);

  const lockDelayMs = 500;
  const lockDelayTimer = useRef<NodeJS.Timeout | null>(null);
  const gravityTimer = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync with state.
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { pieceRef.current = piece; }, [piece]);
  useEffect(() => { nextRef.current = next; }, [next]);
  useEffect(() => { holdRef.current = hold; }, [hold]);
  useEffect(() => { canHoldRef.current = canHold; }, [canHold]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const cancelLockTimer = useCallback(() => {
    if (lockDelayTimer.current) {
      clearTimeout(lockDelayTimer.current);
      lockDelayTimer.current = null;
    }
  }, []);

  const spawnPiece = useCallback(
    (p: Piece) => {
      if (isGameOver(boardRef.current, p)) {
        setGameOver(true);
        gameOverRef.current = true;
        setPiece(null);
        pieceRef.current = null;
      } else {
        setPiece(p);
        pieceRef.current = p;
        setCanHold(true);
        canHoldRef.current = true;
      }
    },
    []
  );

  const lockPiece = useCallback(() => {
    cancelLockTimer();
    const cur = pieceRef.current;
    if (!cur) return;

    // merge current piece into board
    const merged = mergePiece(boardRef.current, cur);
    const { board: clearedBoard, cleared } = clearLines(merged);

    const newLines = linesRef.current + cleared;
    const newComputedLevel = Math.floor(newLines / 10) + 1;
    const newLevel = newComputedLevel > levelRef.current ? newComputedLevel : levelRef.current;
    const newScore = cleared > 0 ? score + calculateScoreAgents(cleared, levelRef.current) : score;

    // commit to state & refs
    boardRef.current = clearedBoard;
    setBoard(clearedBoard);
    setLines(newLines);
    setScore(newScore);
    setLevel(newLevel);
    levelRef.current = newLevel;
    linesRef.current = newLines;

    // spawn next piece
    const nxt = nextRef.current;
    const following = randomPiece();
    nextRef.current = following;
    setNext(following);

    spawnPiece(nxt);
  }, [cancelLockTimer, score, spawnPiece]);

  const startLockTimer = useCallback(() => {
    if (lockDelayTimer.current) return;
    lockDelayTimer.current = setTimeout(() => {
      lockDelayTimer.current = null;
      lockPiece();
    }, lockDelayMs);
  }, [lockPiece]);

  const drop = useCallback(() => {
    const cur = pieceRef.current;
    if (!cur) return;
    const moved = movePiece(boardRef.current, cur, 0, 1);
    if (moved) {
      pieceRef.current = moved;
      setPiece(moved);
      cancelLockTimer();
    } else {
      startLockTimer();
    }
  }, [cancelLockTimer, startLockTimer]);

  // ---- GRAVITY ----
  const startGravity = useCallback(() => {
    if (gravityTimer.current) return;
    const interval = setInterval(() => {
      if (!gameOverRef.current && !pausedRef.current) drop();
    }, levelToInterval(levelRef.current));
    gravityTimer.current = interval as unknown as NodeJS.Timeout;
  }, [drop]);

  const stopGravity = useCallback(() => {
    if (gravityTimer.current) {
      clearInterval(gravityTimer.current as unknown as NodeJS.Timeout);
      gravityTimer.current = null;
    }
  }, []);

  // Start gravity whenever level changes (interval speed) or pause/gameover changes.
  useEffect(() => {
    if (!gameOver && !paused) {
      startGravity();
    } else {
      stopGravity();
    }
    return stopGravity;
  }, [gameOver, paused, level, startGravity, stopGravity]);

  const resetGame = useCallback(() => {
    cancelLockTimer();
    boardRef.current = emptyBoard();
    setBoard(boardRef.current);
    setScore(0);
    setLevel(1);
    levelRef.current = 1;
    setLines(0);
    linesRef.current = 0;
    setGameOver(false);
    gameOverRef.current = false;
    setPaused(false);
    pausedRef.current = false;
    setHold(null);
    holdRef.current = null;
    setCanHold(true);
    canHoldRef.current = true;

    const first = randomPiece();
    const second = randomPiece();
    pieceRef.current = first;
    setPiece(first);
    nextRef.current = second;
    setNext(second);
  }, [cancelLockTimer]);

  // initialise game on mount
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const move = useCallback(
    (dx: number, dy: number) => {
      const cur = pieceRef.current;
      if (!cur) return;
      const moved = movePiece(boardRef.current, cur, dx, dy);
      if (moved) {
        pieceRef.current = moved;
        setPiece(moved);
        cancelLockTimer();
      } else if (dy < 0) {
        // lateral move blocked by wall -> do nothing
      }
    },
    [cancelLockTimer]
  );

  const rotate = useCallback(() => {
    const cur = pieceRef.current;
    if (!cur) return;
    const rotated = rotatePiece(cur);
    if (!collide(boardRef.current, rotated.shape, cur.pos)) {
      pieceRef.current = rotated;
      setPiece(rotated);
      cancelLockTimer();
    }
  }, [cancelLockTimer]);

  const hardDrop = useCallback(() => {
    cancelLockTimer();
    const cur = pieceRef.current;
    if (!cur) return;
    let y = cur.pos.y;
    while (!collide(boardRef.current, cur.shape, { x: cur.pos.x, y: y + 1 })) {
      y++;
    }
    const dropped = { ...cur, pos: { x: cur.pos.x, y } };
    pieceRef.current = dropped;
    setPiece(dropped);
    lockPiece();
  }, [cancelLockTimer, lockPiece]);

  const doHold = useCallback(() => {
    const cur = pieceRef.current;
    if (!cur || !canHoldRef.current) return;
    cancelLockTimer();

    // reset horizontal position of the current piece to spawn for the swap-in
    const resetCur = { ...cur, pos: { x: Math.floor((boardWidth - cur.shape[0].length) / 2), y: 0 } };

    if (holdRef.current) {
      const swapped = holdRef.current;
      holdRef.current = resetCur;
      setHold(resetCur);
      spawnPiece(swapped);
    } else {
      holdRef.current = resetCur;
      setHold(resetCur);
      // spawn next piece
      const nxt = nextRef.current;
      const following = randomPiece();
      nextRef.current = following;
      setNext(following);
      spawnPiece(nxt);
    }
    setCanHold(false);
    canHoldRef.current = false;
  }, [cancelLockTimer, spawnPiece]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (gameOverRef.current) {
        if (e.key === 'r' || e.key === 'R') resetGame();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        setPaused(p => {
          const nextPaused = !p;
          pausedRef.current = nextPaused;
          return nextPaused;
        });
        return;
      }
      if (pausedRef.current) return;
      if (e.repeat && e.key !== 'ArrowDown') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
          doHold();
          break;
        default:
          break;
      }
    },
    [move, rotate, hardDrop, doHold, resetGame]
  );

  // attach keyboard listener once
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const cells: { x: number; y: number; id: number }[] = [];
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      const v = boardRef.current[y][x];
      if (v !== 0) cells.push({ x, y, id: v });
    }
  }
  if (piece) {
    piece.shape.forEach((row, dy) => {
      row.forEach((v, dx) => {
        if (v !== 0) {
          const bx = piece.pos.x + dx;
          const by = piece.pos.y + dy;
          if (by >= 0 && by < boardHeight && bx >= 0 && bx < boardWidth) {
            cells.push({ x: bx, y: by, id: piece.id });
          }
        }
      });
    });
  }

  return (
    <div className="game-container" tabIndex={0}>
      <div className="stats">
        <div>Score: {score}</div>
        <div>Level: {level}</div>
        <div>Lines: {lines}</div>
      </div>

      <div className="play-area">
        <div
          className="board"
          style={{ width: boardWidth * CELL_SIZE, height: boardHeight * CELL_SIZE }}
        >
          {cells.map(c => (
            <div
              key={`${c.x}-${c.y}`}
              className="cell filled"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: PIECE_COLORS[c.id],
                position: 'absolute',
                left: c.x * CELL_SIZE,
                top: c.y * CELL_SIZE,
              }}
            />
          ))}
        </div>

        <div className="side-panel">
          <div className="hold-panel">
            <h4>Hold</h4>
            <PiecePreview piece={hold} dimmed={!canHold} />
          </div>

          <div className="next-panel">
            <h4>Next</h4>
            <PiecePreview piece={next} />
          </div>

          <div className="controls">
            <p>← → move</p>
            <p>↑ rotate</p>
            <p>↓ soft drop</p>
            <p>Space hard drop</p>
            <p>C hold</p>
            <p>P pause</p>
          </div>
        </div>
      </div>

      {paused && (
        <div className="overlay">
          <div className="overlay-text">Paused</div>
        </div>
      )}

      {gameOver && (
        <div className="overlay">
          <div className="overlay-text">
            Game Over
            <div className="overlay-sub">Score: {score}</div>
            <button onClick={resetGame}>Play again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;