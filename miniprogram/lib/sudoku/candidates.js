const { validateGridShape, getConflicts } = require('./validate');
const { getPeerIndices } = require('./grid');

function getCandidates(grid, index) {
  const shape = validateGridShape(grid);
  if (!shape.ok) return [];
  if (index < 0 || index > 80 || !Number.isInteger(index)) return [];
  if (grid[index] !== 0) return [];
  if (getConflicts(grid).length > 0) return [];

  const disallowed = new Set();
  for (const peer of getPeerIndices(index)) {
    const value = grid[peer];
    if (value > 0) disallowed.add(value);
  }

  const candidates = [];
  for (let d = 1; d <= 9; d += 1) {
    if (!disallowed.has(d)) candidates.push(d);
  }
  return candidates;
}

module.exports = { getCandidates };
