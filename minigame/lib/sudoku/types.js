const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

const ERROR_CODES = {
  E_GRID_SHAPE: 'E_GRID_SHAPE',
  E_GRID_VALUE_RANGE: 'E_GRID_VALUE_RANGE',
  E_INVALID_MOVE: 'E_INVALID_MOVE',
  E_PUZZLE_NOT_FOUND: 'E_PUZZLE_NOT_FOUND',
  E_PUZZLE_INVALID: 'E_PUZZLE_INVALID',
  E_UNSOLVABLE: 'E_UNSOLVABLE'
};

const SOLVE_STATUS = {
  SOLVED: 'solved',
  INVALID_GRID: 'invalid_grid',
  UNSOLVABLE: 'unsolvable',
  MULTIPLE_SOLUTIONS: 'multiple_solutions'
};

module.exports = {
  DIFFICULTIES,
  ERROR_CODES,
  SOLVE_STATUS
};
