// src/game.ts
export type Piece = {
  shape: number[][];
  id: number;
  rotation: number;
  pos: { x: number; y: number };
};

export type PieceName = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export const PIECE_MAP: Record<PieceName, number> = {
  I: 1,
  J: 2,
  L: 3,
  O: 4,
  S: 5,
  T: 6,
  Z: 7,
};

export const PIECE_COLORS: Record<number, string> = {
  1: '#4cc9f0', // I — arándano (celeste)
  2: '#4361ee', // J — azul profundo
  3: '#ff9f1c', // L — naranja caramelo
  4: '#ffd60a', // O — limón
  5: '#06d6a0', // S — menta
  6: '#b5179e', // T — uva (morado)
  7: '#ef476f', // Z — fresa (rosa/rojo)
};

export const boardWidth = 10;
export const boardHeight = 20;

// Tetromino shapes (4x4 matrices)
const TETROMINOES: Record<PieceName, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
};

export function emptyBoard(): number[][] {
  return Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));
}

/**
 * Normalize a tetromino shape for preview: strip empty rows/columns
 * from the top/bottom/left/right, returning the tight bounding box.
 */
export function trimShape(shape: number[][]): number[][] {
  if (shape.length === 0 || shape[0].length === 0) return shape;
  const rows = shape.length;
  const cols = shape[0].length;

  let top = rows;
  let bottom = -1;
  let left = cols;
  let right = -1;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (shape[y][x] !== 0) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (bottom < 0) return [[]]; // empty shape

  const out: number[][] = [];
  for (let y = top; y <= bottom; y++) {
    out.push(shape[y].slice(left, right + 1));
  }
  return out;
}

export function randomPiece(): Piece {
  const names: PieceName[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const name = names[Math.floor(Math.random() * names.length)];
  const id = PIECE_MAP[name];
  const shape = TETROMINOES[name][0];
  const spawnX = Math.floor((boardWidth - shape[0].length) / 2);
  return { shape, id, rotation: 0, pos: { x: spawnX, y: 0 } };
}

export function rotatePiece(piece: Piece): Piece {
  const shape = piece.shape;
  const N = shape.length;
  const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      result[x][N - 1 - y] = shape[y][x];
    }
  }
  return { ...piece, shape: result, rotation: (piece.rotation + 1) % 4 };
}

export function collide(board: number[][], shape: number[][], pos: { x: number; y: number }): boolean {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const boardY = y + pos.y;
        const boardX = x + pos.x;
        if (
          boardY >= boardHeight ||
          boardX < 0 ||
          boardX >= boardWidth ||
          (boardY >= 0 && board[boardY][boardX] !== 0)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export function movePiece(board: number[][], piece: Piece, dx: number, dy: number): Piece | null {
  const newPos = { x: piece.pos.x + dx, y: piece.pos.y + dy };
  if (!collide(board, piece.shape, newPos)) {
    return { ...piece, pos: newPos };
  }
  return null;
}

export function mergePiece(board: number[][], piece: Piece): number[][] {
  const newBoard = board.map(row => row.slice());
  const { shape, id, pos } = piece;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const boardY = y + pos.y;
        const boardX = x + pos.x;
        if (boardY >= 0 && boardY < boardHeight && boardX >= 0 && boardX < boardWidth) {
          newBoard[boardY][boardX] = id;
        }
      }
    }
  }
  return newBoard;
}

export function clearLines(board: number[][]): { board: number[][]; cleared: number } {
  let cleared = 0;
  const filtered = board.filter(row => {
    if (row.every(cell => cell !== 0)) {
      cleared++;
      return false;
    }
    return true;
  });
  while (filtered.length < boardHeight) {
    filtered.unshift(Array(boardWidth).fill(0));
  }
  return { board: filtered, cleared };
}

export function isGameOver(board: number[][], piece: Piece): boolean {
  return collide(board, piece.shape, piece.pos);
}

export function levelToInterval(level: number): number {
  const frames = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2];
  const idx = Math.min(level - 1, frames.length - 1);
  return (frames[idx] / 60) * 1000;
}

export function calculateScoreAgents(lines: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return base[lines] * level;
}
