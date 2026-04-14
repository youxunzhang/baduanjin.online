const { SudokuGame } = require('../../lib/sudoku');

const GAME_STATE_KEY = 'sudoku_game_state_v1';
const SETTINGS_KEY = 'sudoku_settings_v1';
const MISTAKE_LIMIT = 3;

const ERROR_TEXT = {
  E_GRID_SHAPE: '盘面结构异常',
  E_GRID_VALUE_RANGE: '数字范围不合法',
  E_INVALID_MOVE: '数字冲突，请换一个数字',
  E_PUZZLE_NOT_FOUND: '题目不存在',
  E_PUZZLE_INVALID: '题目数据异常',
  E_UNSOLVABLE: '当前盘面无解'
};

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: '入门' },
  { value: 'easy', label: '初级' },
  { value: 'medium', label: '中级' },
  { value: 'hard', label: '高级' }
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

function formatElapsed(sec) {
  const safe = Math.max(0, Number(sec) || 0);
  const min = String(Math.floor(safe / 60)).padStart(2, '0');
  const second = String(safe % 60).padStart(2, '0');
  return `${min}:${second}`;
}

Page({
  data: {
    grid: Array(81).fill(0),
    givensMask: Array(81).fill(false),
    selectedIndex: -1,
    conflicts: [],
    difficulty: 'beginner',
    difficultyOptions: DIFFICULTY_OPTIONS,
    difficultyIndex: 0,
    statusText: '继续加油！',
    elapsedSec: 0,
    elapsedText: '00:00',
    mistakeCount: 0,
    mistakeLimit: MISTAKE_LIMIT,
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
    this.timer = null;
    this.restoreSettings();
    this.onTapNewGame();
  },

  onShow() {
    this.restoreGame();
    this.startTimer();
  },

  onHide() {
    this.stopTimer();
    this.persistGame();
  },

  onUnload() {
    this.stopTimer();
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

  onTapDifficulty(e) {
    const index = Number(e.currentTarget.dataset.index);
    const selected = DIFFICULTY_OPTIONS[index] || DIFFICULTY_OPTIONS[0];
    this.setData({
      difficultyIndex: index,
      difficulty: selected.value
    });
    this.onTapNewGame();
  },

  onTapNewGame() {
    const result = this.game.newGame({ difficulty: this.data.difficulty });
    this.syncFromResult(result, '新游戏开始啦！');
    this.startTimer();
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
      elapsedText: formatElapsed(state.elapsedSec),
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
    const errorText = ERROR_TEXT[code] || '操作失败';
    const mistakeCount = this.game && this.game.state ? this.game.state.mistakeCount : this.data.mistakeCount;
    const reachedLimit = mistakeCount >= this.data.mistakeLimit;
    const statusText = reachedLimit
      ? `${errorText}，错误已达 ${this.data.mistakeLimit} 次，请仔细检查后继续。`
      : `${errorText}（错误 ${mistakeCount}/${this.data.mistakeLimit}）`;

    this.setData({
      mistakeCount,
      statusText
    });

    if (reachedLimit) {
      wx.showToast({
        title: '错误次数已达上限',
        icon: 'none'
      });
    }
  },

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      const state = this.game && this.game.getState && this.game.getState();
      if (!state || !state.startedAt) return;
      const elapsedSec = Math.floor((Date.now() - state.startedAt) / 1000);
      if (elapsedSec !== this.data.elapsedSec) {
        this.setData({
          elapsedSec,
          elapsedText: formatElapsed(elapsedSec)
        });
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
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
        largeText: Boolean(settings.largeText),
        bigButtons: Boolean(settings.bigButtons),
        highContrast: Boolean(settings.highContrast)
      });
    } catch (_error) {
      // ignore bad cache
    }
  },

  restoreGame() {
    const cache = wx.getStorageSync(GAME_STATE_KEY);
    if (!cache) return;
    const result = this.game.restore(cache);
    if (!result.ok) return;

    const state = result.state || {};
    const diffIndex = DIFFICULTY_OPTIONS.findIndex(item => item.value === state.difficulty);
    this.setData({
      difficulty: state.difficulty || this.data.difficulty,
      difficultyIndex: diffIndex >= 0 ? diffIndex : this.data.difficultyIndex
    });
    this.syncFromResult(result, '已恢复进度');
  }
});
