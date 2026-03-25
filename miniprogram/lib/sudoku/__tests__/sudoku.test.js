const assert = require('assert');
const { validateGrid, getConflicts } = require('../validate');
const { getCandidates } = require('../candidates');
const { solve } = require('../solver');

const puzzle = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'.split('').map(Number);

(function testValidateGrid() {
  assert.equal(validateGrid(puzzle).ok, true, '合法盘面应通过校验');
  const invalid = puzzle.slice();
  invalid[0] = 6;
  assert.equal(validateGrid(invalid).ok, false, '冲突盘面应校验失败');
})();

(function testGetConflicts() {
  const invalid = puzzle.slice();
  invalid[0] = 6;
  const conflicts = getConflicts(invalid);
  assert(conflicts.includes(0), '冲突中必须包含冲突格');
})();

(function testCandidates() {
  const candidates = getCandidates(puzzle, 2);
  assert.deepEqual(candidates, [1, 2, 4], '候选数计算不正确');
})();

(function testSolve() {
  const result = solve(puzzle);
  assert.equal(result.status, 'solved', '求解状态应为 solved');
  assert.equal(result.solution.length, 81, '求解结果长度应为 81');
})();

console.log('sudoku tests passed');
