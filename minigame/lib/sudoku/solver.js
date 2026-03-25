const { SOLVE_STATUS } = require('./types');
const { validateGrid } = require('./validate');
const { getCandidates } = require('./candidates');

function clone(grid) {
  return grid.slice();
}

function isComplete(grid) {
  return grid.every((value) => value >= 1 && value <= 9);
}

function chooseBestCell(grid) {
  let bestIndex = -1;
  let bestCandidates = null;

  for (let i = 0; i < 81; i += 1) {
    if (grid[i] !== 0) continue;
    const candidates = getCandidates(grid, i);
    if (candidates.length === 0) {
      return { index: i, candidates: [] };
    }
    if (!bestCandidates || candidates.length < bestCandidates.length) {
      bestIndex = i;
      bestCandidates = candidates;
      if (candidates.length === 1) break;
    }
  }

  return { index: bestIndex, candidates: bestCandidates || [] };
}

function countSolutions(grid, limit = 2) {
  const valid = validateGrid(grid);
  if (!valid.ok) return 0;
  let found = 0;

  function dfs(state) {
    if (found >= limit) return;
    if (isComplete(state)) {
      found += 1;
      return;
    }

    const { index, candidates } = chooseBestCell(state);
    if (index === -1 || candidates.length === 0) return;

    for (const value of candidates) {
      state[index] = value;
      dfs(state);
      state[index] = 0;
      if (found >= limit) return;
    }
  }

  dfs(clone(grid));
  return found;
}

function solve(grid) {
  const valid = validateGrid(grid);
  if (!valid.ok) {
    return { status: SOLVE_STATUS.INVALID_GRID };
  }

  const solutionCount = countSolutions(grid, 2);
  if (solutionCount === 0) return { status: SOLVE_STATUS.UNSOLVABLE };
  if (solutionCount > 1) return { status: SOLVE_STATUS.MULTIPLE_SOLUTIONS };

  const state = clone(grid);
  const steps = [];
  let backtracks = 0;

  function dfs() {
    if (isComplete(state)) return true;
    const { index, candidates } = chooseBestCell(state);
    if (index === -1 || candidates.length === 0) return false;

    for (const value of candidates) {
      state[index] = value;
      steps.push({ index, value });
      if (dfs()) return true;
      state[index] = 0;
      steps.push({ index, value: 0 });
      backtracks += 1;
    }
    return false;
  }

  const ok = dfs();
  if (!ok) return { status: SOLVE_STATUS.UNSOLVABLE };

  return {
    status: SOLVE_STATUS.SOLVED,
    solution: state,
    steps,
    backtracks
  };
}

module.exports = {
  solve,
  countSolutions
};
