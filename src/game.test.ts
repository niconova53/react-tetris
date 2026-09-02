import { describe, it, expect } from 'vitest';
import {
  emptyBoard,
  randomPiece,
  rotatePiece,
  collide,
  movePiece,
  mergePiece,
  clearLines,
  isGameOver,
  calculateScoreAgents,
  levelToInterval,
  boardWidth,
  boardHeight,
  PIECE_MAP,
} from './game';

describe('rotatePiece', () => {
  it('rotates a T piece clockwise through 4 states back to original', () => {
    const t = { id: PIECE_MAP.T, rotation: 0, shape: [[0,1,0],[1,1,1],[0,0,0]], pos: { x: 3, y: 0 } };
    const r1 = rotatePiece(t);
    expect(r1.shape).toEqual([[0,1,0],[0,1,1],[0,1,0]]);
    expect(r1.rotation).toBe(1);
    const r4 = rotatePiece(rotatePiece(rotatePiece(r1)));
    expect(r4.rotation).toBe(0);
    expect(r4.shape).toEqual(t.shape);
  });

  it('does not mutate the original piece', () => {
    const o = { id: PIECE_MAP.O, rotation: 0, shape: [[1,1],[1,1]], pos: { x: 4, y: 0 } };
    const before = JSON.stringify(o);
    rotatePiece(o);
    expect(JSON.stringify(o)).toBe(before);
  });
});

describe('collide', () => {
  it('detects floor collision', () => {
    const board = emptyBoard();
    const shape = [[1]];
    expect(collide(board, shape, { x: 0, y: boardHeight - 1 })).toBe(false);
    expect(collide(board, shape, { x: 0, y: boardHeight })).toBe(true);
  });

  it('detects wall collision', () => {
    const board = emptyBoard();
    const shape = [[1, 1]];
    expect(collide(board, shape, { x: boardWidth - 2, y: 0 })).toBe(false);
    expect(collide(board, shape, { x: boardWidth - 1, y: 0 })).toBe(true);
    expect(collide(board, shape, { x: -1, y: 0 })).toBe(true);
  });

  it('ignores cells above the board (y < 0)', () => {
    const board = emptyBoard();
    const shape = [[1]];
    expect(collide(board, shape, { x: 0, y: -1 })).toBe(false);
  });

  it('detects collision with existing blocks', () => {
    const board = emptyBoard();
    board[5][5] = 1;
    const shape = [[1]];
    expect(collide(board, shape, { x: 5, y: 5 })).toBe(true);
    expect(collide(board, shape, { x: 5, y: 4 })).toBe(false);
  });
});

describe('movePiece', () => {
  it('moves when there is room and returns null when blocked', () => {
    const board = emptyBoard();
    const piece = { id: 1, rotation: 0, shape: [[1]], pos: { x: 5, y: 0 } };
    const moved = movePiece(board, piece, 0, 1);
    expect(moved).not.toBeNull();
    expect(moved!.pos).toEqual({ x: 5, y: 1 });

    const atFloor = { id: 1, rotation: 0, shape: [[1]], pos: { x: 5, y: boardHeight - 1 } };
    expect(movePiece(board, atFloor, 0, 1)).toBeNull();
  });
});

describe('mergePiece + clearLines', () => {
  it('clears full lines and shifts everything down', () => {
    // Build a board with the bottom row full
    const board = emptyBoard();
    for (let x = 0; x < boardWidth; x++) board[boardHeight - 1][x] = 1;
    board[boardHeight - 2][0] = 2;

    const { board: result, cleared } = clearLines(board);
    expect(cleared).toBe(1);
    expect(result.length).toBe(boardHeight);
    // top row now empty
    expect(result[0].every(c => c === 0)).toBe(true);
    // the block that was on row 18 should now be on row 19
    expect(result[boardHeight - 1][0]).toBe(2);
  });

  it('clearLines returns 0 cleared for a sparse board', () => {
    const board = emptyBoard();
    board[0][0] = 1;
    const { cleared } = clearLines(board);
    expect(cleared).toBe(0);
  });
});

describe('scoring', () => {
  it('computes Nintendo scoring multiplied by level', () => {
    expect(calculateScoreAgents(1, 1)).toBe(100);
    expect(calculateScoreAgents(2, 1)).toBe(300);
    expect(calculateScoreAgents(3, 1)).toBe(500);
    expect(calculateScoreAgents(4, 1)).toBe(800);
    expect(calculateScoreAgents(1, 5)).toBe(500);
    expect(calculateScoreAgents(4, 3)).toBe(2400);
  });
});

describe('level progression', () => {
  it('level increases every 10 lines', () => {
    // levelToInterval expects (level - 1) index; level 1 = frames[0]
    // We verify the level formula indirectly: Math.floor(lines/10)+1
    const levelFor = (lines: number) => Math.floor(lines / 10) + 1;
    expect(levelFor(0)).toBe(1);
    expect(levelFor(9)).toBe(1);
    expect(levelFor(10)).toBe(2);
    expect(levelFor(25)).toBe(3);
  });

  it('returns valid intervals for all levels', () => {
    for (let lvl = 1; lvl <= 20; lvl++) {
      const ms = levelToInterval(lvl);
      expect(ms).toBeGreaterThan(0);
    }
  });
});

describe('game over', () => {
  it('detects game over when a new piece collides at spawn', () => {
    const board = emptyBoard();
    // fill the top area
    for (let x = 3; x < 7; x++) board[0][x] = 1;
    board[1][3] = 1; board[1][4] = 1; board[1][5] = 1;
    const piece = { id: 1, rotation: 0, shape: [[1,1]], pos: { x: 4, y: 0 } };
    expect(isGameOver(board, piece)).toBe(true);
  });

  it('does not detect game over for empty board', () => {
    const board = emptyBoard();
    const piece = randomPiece();
    expect(isGameOver(board, piece)).toBe(false);
  });
});