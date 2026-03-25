function assertRange(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} out of range: ${value}`);
  }
}

function rowColToIndex(row, col) {
  assertRange(row, 0, 8, 'row');
  assertRange(col, 0, 8, 'col');
  return row * 9 + col;
}

function indexToRowCol(index) {
  assertRange(index, 0, 80, 'index');
  return {
    row: Math.floor(index / 9),
    col: index % 9
  };
}

function getRowIndices(row) {
  assertRange(row, 0, 8, 'row');
  const start = row * 9;
  return Array.from({ length: 9 }, (_, i) => start + i);
}

function getColIndices(col) {
  assertRange(col, 0, 8, 'col');
  return Array.from({ length: 9 }, (_, i) => i * 9 + col);
}

function getBoxIndices(boxIndex) {
  assertRange(boxIndex, 0, 8, 'boxIndex');
  const boxRow = Math.floor(boxIndex / 3) * 3;
  const boxCol = (boxIndex % 3) * 3;
  const indices = [];
  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      indices.push(rowColToIndex(r, c));
    }
  }
  return indices;
}

function getBoxIndexByCell(index) {
  const { row, col } = indexToRowCol(index);
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function getPeerIndices(index) {
  const { row, col } = indexToRowCol(index);
  const boxIndex = getBoxIndexByCell(index);
  const peers = new Set([
    ...getRowIndices(row),
    ...getColIndices(col),
    ...getBoxIndices(boxIndex)
  ]);
  peers.delete(index);
  return Array.from(peers);
}

module.exports = {
  rowColToIndex,
  indexToRowCol,
  getRowIndices,
  getColIndices,
  getBoxIndices,
  getBoxIndexByCell,
  getPeerIndices
};
