const puzzles = require('../../data/sudoku-puzzles.json');
const { DIFFICULTIES, ERROR_CODES } = require('./types');

function parseGrid(value) {
  if (Array.isArray(value)) return value.slice();
  return String(value).split('').map((ch) => Number(ch));
}

function getPuzzleByDifficulty(difficulty) {
  if (!DIFFICULTIES.includes(difficulty)) {
    return { ok: false, code: ERROR_CODES.E_PUZZLE_NOT_FOUND, message: '难度不存在' };
  }
  const list = puzzles[difficulty] || [];
  if (list.length === 0) {
    return { ok: false, code: ERROR_CODES.E_PUZZLE_NOT_FOUND, message: '题库为空' };
  }
  const picked = list[Math.floor(Math.random() * list.length)];
  return {
    ok: true,
    puzzle: {
      id: picked.id,
      difficulty,
      puzzle: parseGrid(picked.puzzle),
      solution: parseGrid(picked.solution),
      givensCount: parseGrid(picked.puzzle).filter((x) => x !== 0).length
    }
  };
}

function getPuzzleById(puzzleId, difficulty) {
  const diffList = difficulty ? [difficulty] : DIFFICULTIES;
  for (const diff of diffList) {
    const found = (puzzles[diff] || []).find((item) => item.id === puzzleId);
    if (found) {
      return {
        ok: true,
        puzzle: {
          id: found.id,
          difficulty: diff,
          puzzle: parseGrid(found.puzzle),
          solution: parseGrid(found.solution),
          givensCount: parseGrid(found.puzzle).filter((x) => x !== 0).length
        }
      };
    }
  }
  return { ok: false, code: ERROR_CODES.E_PUZZLE_NOT_FOUND, message: '题目不存在' };
}

module.exports = {
  getPuzzleByDifficulty,
  getPuzzleById,
  parseGrid
};
