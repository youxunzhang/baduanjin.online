const { ERROR_CODES } = require('./types');
const { getRowIndices, getColIndices, getBoxIndices, getPeerIndices } = require('./grid');

function validateGridShape(grid) {
  if (!Array.isArray(grid) || grid.length !== 81) {
    return { ok: false, code: ERROR_CODES.E_GRID_SHAPE, message: '盘面必须为长度 81 的数组' };
  }
  return { ok: true };
}

function validateValueRange(grid) {
  for (let i = 0; i < grid.length; i += 1) {
    const value = grid[i];
    if (!Number.isInteger(value) || value < 0 || value > 9) {
      return { ok: false, code: ERROR_CODES.E_GRID_VALUE_RANGE, index: i, message: `格子 ${i} 数值越界` };
    }
  }
  return { ok: true };
}

function hasDuplicates(values) {
  const seen = new Set();
  for (const value of values) {
    if (value === 0) continue;
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}

function validateGrid(grid) {
  const shape = validateGridShape(grid);
  if (!shape.ok) return shape;

  const range = validateValueRange(grid);
  if (!range.ok) return range;

  for (let i = 0; i < 9; i += 1) {
    const row = getRowIndices(i).map((idx) => grid[idx]);
    const col = getColIndices(i).map((idx) => grid[idx]);
    const box = getBoxIndices(i).map((idx) => grid[idx]);
    if (hasDuplicates(row) || hasDuplicates(col) || hasDuplicates(box)) {
      return { ok: false, code: ERROR_CODES.E_INVALID_MOVE, message: '盘面存在重复冲突' };
    }
  }

  return { ok: true };
}

function getConflicts(grid) {
  const shape = validateGridShape(grid);
  if (!shape.ok) return [];

  const conflicts = new Set();
  for (let i = 0; i < 81; i += 1) {
    const value = grid[i];
    if (value === 0) continue;
    const peers = getPeerIndices(i);
    for (const peer of peers) {
      if (grid[peer] === value) {
        conflicts.add(i);
        conflicts.add(peer);
      }
    }
  }
  return Array.from(conflicts).sort((a, b) => a - b);
}

function isMoveLegal(grid, index, value) {
  if (!Number.isInteger(value) || value < 1 || value > 9) return false;
  const testGrid = grid.slice();
  testGrid[index] = value;
  const conflicts = getConflicts(testGrid);
  return !conflicts.includes(index);
}

module.exports = {
  validateGridShape,
  validateGrid,
  getConflicts,
  isMoveLegal
};
