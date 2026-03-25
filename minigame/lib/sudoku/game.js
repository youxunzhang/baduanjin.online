const { ERROR_CODES, SOLVE_STATUS } = require('./types');
const { getPuzzleByDifficulty, getPuzzleById } = require('./generator');
const { getConflicts, isMoveLegal } = require('./validate');
const { getCandidates } = require('./candidates');
const { solve } = require('./solver');

class SudokuGame {
  constructor() {
    this.state = null;
  }

  newGame({ difficulty = 'easy', puzzleId } = {}) {
    const result = puzzleId ? getPuzzleById(puzzleId, difficulty) : getPuzzleByDifficulty(difficulty);
    if (!result.ok) return result;

    const { puzzle } = result;
    const givensMask = puzzle.puzzle.map((value) => value !== 0);
    this.state = {
      puzzleId: puzzle.id,
      difficulty: puzzle.difficulty,
      puzzle: puzzle.puzzle.slice(),
      solution: puzzle.solution.slice(),
      grid: puzzle.puzzle.slice(),
      givensMask,
      conflicts: [],
      mistakeCount: 0,
      isSolved: false,
      startedAt: Date.now(),
      elapsedSec: 0,
      history: [],
      future: []
    };

    return { ok: true, state: this.getState() };
  }

  getState() {
    return this.state ? JSON.parse(JSON.stringify(this.state)) : null;
  }

  ensureReady() {
    if (!this.state) {
      return { ok: false, code: ERROR_CODES.E_PUZZLE_NOT_FOUND, message: '请先开局' };
    }
    return { ok: true };
  }

  input(index, value) {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;
    if (this.state.givensMask[index]) {
      return { ok: false, code: ERROR_CODES.E_INVALID_MOVE, message: '给定格不能修改' };
    }
    if (!isMoveLegal(this.state.grid, index, value)) {
      this.state.mistakeCount += 1;
      return { ok: false, code: ERROR_CODES.E_INVALID_MOVE, message: '该数字与现有盘面冲突' };
    }

    this.state.history.push({ index, prev: this.state.grid[index], next: value });
    this.state.future = [];
    this.state.grid[index] = value;
    this.refreshDerived();
    return { ok: true, state: this.getState() };
  }

  erase(index) {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;
    if (this.state.givensMask[index]) {
      return { ok: false, code: ERROR_CODES.E_INVALID_MOVE, message: '给定格不能擦除' };
    }
    const prev = this.state.grid[index];
    this.state.history.push({ index, prev, next: 0 });
    this.state.future = [];
    this.state.grid[index] = 0;
    this.refreshDerived();
    return { ok: true, state: this.getState() };
  }

  check() {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;
    this.refreshDerived();
    return {
      ok: true,
      conflicts: this.state.conflicts.slice(),
      isSolved: this.state.isSolved
    };
  }

  hint() {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;

    for (let i = 0; i < 81; i += 1) {
      if (this.state.grid[i] !== 0) continue;
      const cands = getCandidates(this.state.grid, i);
      if (cands.length === 1) {
        const value = cands[0];
        this.input(i, value);
        return { ok: true, index: i, value, reason: 'single_candidate', state: this.getState() };
      }
    }

    const solved = solve(this.state.grid);
    if (solved.status !== SOLVE_STATUS.SOLVED) {
      return { ok: false, code: ERROR_CODES.E_UNSOLVABLE, message: '当前盘面无法给出提示' };
    }

    for (let i = 0; i < 81; i += 1) {
      if (this.state.grid[i] === 0) {
        const value = solved.solution[i];
        this.input(i, value);
        return { ok: true, index: i, value, reason: 'from_solver', state: this.getState() };
      }
    }

    return { ok: true, index: -1, value: 0, reason: 'already_full', state: this.getState() };
  }

  solve() {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;

    const solved = solve(this.state.grid);
    if (solved.status !== SOLVE_STATUS.SOLVED) {
      return { ok: false, code: ERROR_CODES.E_UNSOLVABLE, status: solved.status, message: '盘面不可解' };
    }
    this.state.grid = solved.solution.slice();
    this.refreshDerived();
    this.state.isSolved = true;
    return { ok: true, state: this.getState(), backtracks: solved.backtracks };
  }

  undo() {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;
    const op = this.state.history.pop();
    if (!op) return { ok: false, message: '没有可撤销操作' };
    this.state.future.push(op);
    this.state.grid[op.index] = op.prev;
    this.refreshDerived();
    return { ok: true, state: this.getState() };
  }

  redo() {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;
    const op = this.state.future.pop();
    if (!op) return { ok: false, message: '没有可重做操作' };
    this.state.history.push(op);
    this.state.grid[op.index] = op.next;
    this.refreshDerived();
    return { ok: true, state: this.getState() };
  }

  serialize() {
    const ready = this.ensureReady();
    if (!ready.ok) return ready;
    return { ok: true, data: JSON.stringify(this.state) };
  }

  restore(payload) {
    try {
      const state = typeof payload === 'string' ? JSON.parse(payload) : payload;
      if (!state || !Array.isArray(state.grid) || state.grid.length !== 81) {
        return { ok: false, code: ERROR_CODES.E_PUZZLE_INVALID, message: '存档损坏' };
      }
      this.state = state;
      this.refreshDerived();
      return { ok: true, state: this.getState() };
    } catch (_e) {
      return { ok: false, code: ERROR_CODES.E_PUZZLE_INVALID, message: '存档损坏' };
    }
  }

  refreshDerived() {
    this.state.conflicts = getConflicts(this.state.grid);
    this.state.elapsedSec = Math.floor((Date.now() - this.state.startedAt) / 1000);
    this.state.isSolved = this.state.conflicts.length === 0 && this.state.grid.every((x) => x > 0);
  }
}

module.exports = {
  SudokuGame
};
