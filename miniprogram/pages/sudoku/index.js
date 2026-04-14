const { SudokuGame } = require('../../lib/sudoku');

const GAME_STATE_KEY = 'sudoku_game_state_v1';
const SETTINGS_KEY = 'sudoku_settings_v1';

const ERROR_TEXT = {
  E_GRID_SHAPE: '盘面结构异常',
  E_GRID_VALUE_RANGE: '数字范围不合法',
  E_INVALID_MOVE: '该填入不合法',
  E_PUZZLE_NOT_FOUND: '题目不存在',
  E_PUZZLE_INVALID: '题目数据异常',
  E_UNSOLVABLE: '当前盘面无解'
};

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' }
];

function createCellBorderStyles() {
  return Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const top = row % 3 === 0 ? 4 : 1;
    const left = col % 3 === 0 ? 4 : 1;
    const right = col === 8 ? 4 : 1;
    const bottom = row === 8 ? 4 : 1;

    return `border-top-width:${top}rpx;border-left-width:${left}rpx;border-right-width:${right}rpx;border-bottom-width:${bottom}rpx;`;
  });
}

Page({
  data: {
    grid: Array(81).fill(0),
    givensMask: Array(81).fill(false),
    selectedIndex: -1,
    conflicts: [],
    candidatesPanel: [],
    difficulty: 'easy',
    difficultyLabel: '简单',
    difficultyOptions: DIFFICULTY_OPTIONS,
    difficultyIndex: 0,
    statusText: '继续加油！',
    elapsedSec: 0,
    mistakeCount: 0,
    isSolved: false,
    showVictoryModal: false,
    largeText: false,
    bigButtons: false,
    highContrast: false,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    cellBorderStyle: createCellBorderStyles()
  },

  onLoad() {
    this.game = new SudokuGame();
    this.restoreSettings();
    this.onTapNewGame();
  },

  onShow() {
    this.restoreGame();
  },

  onHide() {
    this.persistGame();
  },

  onUnload() {
    this.persistGame();
  },

  onTapCell(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ selectedIndex: index });
  },

  onInputNumber(e) {
    const value = Number(e.currentTarget.dataset.value);
    const { selectedIndex } = this.data;
    if (selectedIndex < 0) {
      this.setData({ statusText: '请先点击一个格子' });
      return;
    }
    const result = this.game.input(selectedIndex, value);
    this.syncFromResult(result, '继续加油！');
  },

  onTapErase() {
    const { selectedIndex } = this.data;
    if (selectedIndex < 0) {
      this.setData({ statusText: '请先点击一个格子' });
      return;
    }
    const result = this.game.erase(selectedIndex);
    this.syncFromResult(result, '已清除当前格');
  },

  onTapCheck() {
    const result = this.game.check();
    if (!result.ok) return this.showError(result.code);
    const statusText = result.isSolved ? '恭喜通关！' : result.conflicts.length ? '存在冲突，请检查红色格子' : '当前无冲突，继续加油！';
    const wasSolved = this.data.isSolved;
    this.setData({ conflicts: result.conflicts, statusText, isSolved: result.isSolved });
    if (result.isSolved && !wasSolved) {
      this.showVictoryModal();
    }
  },

  onTapHint() {
    const result = this.game.hint();
    this.syncFromResult(result, '已填入一个提示格');
  },

  onTapSolve() {
    const result = this.game.solve();
    this.syncFromResult(result, '已显示答案，可以再玩一局！');
  },

  onDifficultyChange(e) {
    const index = Number(e.detail.value);
    const selected = DIFFICULTY_OPTIONS[index] || DIFFICULTY_OPTIONS[0];
    this.setData({
      difficultyIndex: index,
      difficulty: selected.value,
      difficultyLabel: selected.label
    });
    this.onTapNewGame();
  },

  onTapNewGame() {
    const result = this.game.newGame({ difficulty: this.data.difficulty });
    this.syncFromResult(result, '新游戏开始啦！');
  },

  toggleLargeText() {
    this.setData({ largeText: !this.data.largeText });
  },

  toggleBigButtons() {
    this.setData({ bigButtons: !this.data.bigButtons });
  },

  toggleHighContrast() {
    this.setData({ highContrast: !this.data.highContrast });
  },

  syncFromResult(result, successText) {
    if (!result.ok) return this.showError(result.code);
    const state = result.state || this.game.getState();
    const wasSolved = this.data.isSolved;
    this.setData({
      grid: state.grid,
      givensMask: state.givensMask,
      conflicts: state.conflicts,
      elapsedSec: state.elapsedSec,
      mistakeCount: state.mistakeCount,
      isSolved: state.isSolved,
      statusText: successText || (state.isSolved ? '恭喜通关！' : '继续加油！')
    });
    if (state.isSolved && !wasSolved) {
      this.showVictoryModal();
    }
  },

  showVictoryModal() {
    this.setData({ showVictoryModal: true });
  },

  closeVictoryModal() {
    this.setData({ showVictoryModal: false });
  },

  onTapDialog() {},

  showError(code) {
    this.setData({ statusText: ERROR_TEXT[code] || '操作失败' });
  },

  persistGame() {
    const saved = this.game.serialize();
    if (saved.ok) {
      wx.setStorageSync(GAME_STATE_KEY, saved.data);
      wx.setStorageSync(SETTINGS_KEY, JSON.stringify({
        difficulty: this.data.difficulty,
        difficultyIndex: this.data.difficultyIndex,
        largeText: this.data.largeText,
        bigButtons: this.data.bigButtons,
        highContrast: this.data.highContrast
      }));
    }
  },

  restoreSettings() {
    const raw = wx.getStorageSync(SETTINGS_KEY);
    if (!raw) return;

    try {
      const settings = JSON.parse(raw);
      const difficultyIndex = typeof settings.difficultyIndex === 'number'
        ? settings.difficultyIndex
        : DIFFICULTY_OPTIONS.findIndex(item => item.value === settings.difficulty);
      const safeIndex = difficultyIndex >= 0 ? difficultyIndex : 0;
      const selected = DIFFICULTY_OPTIONS[safeIndex];

      this.setData({
        difficulty: selected.value,
        difficultyIndex: safeIndex,
        difficultyLabel: selected.label,
        largeText: Boolean(settings.largeText),
        bigButtons: Boolean(settings.bigButtons),
        highContrast: Boolean(settings.highContrast)
      });
    } catch (error) {
      // ignore bad cache
    }
  },

  restoreGame() {
    const cache = wx.getStorageSync(GAME_STATE_KEY);
    if (!cache) return;
    const result = this.game.restore(cache);
    this.syncFromResult(result, '已恢复进度');
  }
});
