const puzzles = require('../miniprogram/data/sudoku-puzzles.json');
const { validateGrid } = require('../miniprogram/lib/sudoku/validate');
const { countSolutions } = require('../miniprogram/lib/sudoku/solver');
const { parseGrid } = require('../miniprogram/lib/sudoku/generator');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRecord(record, difficulty) {
  const puzzle = parseGrid(record.puzzle);
  const solution = parseGrid(record.solution);

  assert(puzzle.length === 81, `[${record.id}] puzzle 长度必须为 81`);
  assert(solution.length === 81, `[${record.id}] solution 长度必须为 81`);

  assert(validateGrid(solution).ok, `[${record.id}] solution 不是合法终盘`);

  for (let i = 0; i < 81; i += 1) {
    assert(puzzle[i] >= 0 && puzzle[i] <= 9, `[${record.id}] puzzle 包含非法数字`);
    if (puzzle[i] !== 0) {
      assert(puzzle[i] === solution[i], `[${record.id}] puzzle 与 solution 不一致 @${i}`);
    }
  }

  const solutions = countSolutions(puzzle, 2);
  assert(solutions === 1, `[${record.id}] 非唯一解: ${solutions}`);

  return { id: record.id, difficulty };
}

function main() {
  const ok = [];
  for (const difficulty of Object.keys(puzzles)) {
    for (const record of puzzles[difficulty]) {
      ok.push(validateRecord(record, difficulty));
    }
  }
  console.log(`validated ${ok.length} puzzle(s)`);
}

main();
