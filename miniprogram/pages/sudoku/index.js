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

Page({
  data: {
    grid: Array(81).fill(0),
    givensMask: Array(81).fill(false),
    selectedIndex: -1,
    conflicts: [],
    candidatesPanel: [],
    difficulty: 'easy',
    statusText: '准备开始',
    elapsedSec: 0,
    mistakeCount: 0,
    isSolved: false
  },

  onLoad() {
    this.game = new SudokuGame();
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
    const state = this.game.getState();
    const candidatesPanel = state ? (state.grid[index] === 0 ? require('../../lib/sudoku').getCandidates(state.grid, index) : []) : [];
    this.setData({ selectedIndex: index, candidatesPanel });
  },

  onInputNumber(e) {
    const value = Number(e.currentTarget.dataset.value);
    const { selectedIndex } = this.data;
    if (selectedIndex < 0) return;
    const result = this.game.input(selectedIndex, value);
    this.syncFromResult(result);
  },

  onTapErase() {
    const { selectedIndex } = this.data;
    if (selectedIndex < 0) return;
    const result = this.game.erase(selectedIndex);
    this.syncFromResult(result);
  },

  onTapCheck() {
    const result = this.game.check();
    if (!result.ok) return this.showError(result.code);
    const statusText = result.isSolved ? '恭喜通关！' : result.conflicts.length ? '存在冲突，请检查红色格子' : '当前无冲突';
    this.setData({ conflicts: result.conflicts, statusText, isSolved: result.isSolved });
  },

  onTapHint() {
    const result = this.game.hint();
    this.syncFromResult(result, '已填入提示格');
  },

  onTapSolve() {
    const result = this.game.solve();
    this.syncFromResult(result, '已展示答案');
  },

  onTapNewGame() {
    const result = this.game.newGame({ difficulty: this.data.difficulty });
    this.syncFromResult(result, '新局已开始');
  },

  syncFromResult(result, successText) {
    if (!result.ok) return this.showError(result.code);
    const state = result.state || this.game.getState();
    this.setData({
      grid: state.grid,
      givensMask: state.givensMask,
      conflicts: state.conflicts,
      elapsedSec: state.elapsedSec,
      mistakeCount: state.mistakeCount,
      isSolved: state.isSolved,
      statusText: successText || (state.isSolved ? '恭喜通关！' : '进行中')
    });
  },

  showError(code) {
    this.setData({ statusText: ERROR_TEXT[code] || '操作失败' });
  },

  persistGame() {
    const saved = this.game.serialize();
    if (saved.ok) {
      wx.setStorageSync(GAME_STATE_KEY, saved.data);
      wx.setStorageSync(SETTINGS_KEY, JSON.stringify({ difficulty: this.data.difficulty }));
    }
  },

  restoreGame() {
    const cache = wx.getStorageSync(GAME_STATE_KEY);
    if (!cache) return;
    const result = this.game.restore(cache);
    this.syncFromResult(result, '已恢复进度');
  }
});
