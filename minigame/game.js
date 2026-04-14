const { SudokuGame } = require('./lib/sudoku/index');

const game = new SudokuGame();
const DIFFICULTIES = [
  { value: 'beginner', label: '入门' },
  { value: 'easy', label: '初级' },
  { value: 'medium', label: '中级' },
  { value: 'hard', label: '高级' }
];
const MISTAKE_LIMIT = 3;

function createGameCanvas() {
  if (typeof wx.createCanvas === 'function') return wx.createCanvas();
  if (typeof wx.createOffscreenCanvas === 'function') return wx.createOffscreenCanvas({ type: '2d' });
  throw new Error('当前运行环境不支持 Canvas');
}

const canvas = createGameCanvas();
const ctx = canvas.getContext('2d');

let state = null;
let selected = -1;
let statusText = '正在加载数独库小游戏...';
let ratio = 1;
let gridSize = 0;
let cellSize = 0;
let originX = 0;
let originY = 0;
let numButtons = [];
let actionButtons = [];
let difficultyButtons = [];
let titleX = 16;
let titleY = 44;
let difficulty = 'beginner';
const SHARE_IMAGE_URL = 'https://baduanjin.online/icon-512.png';

function getDifficultyLabel(value = difficulty) {
  return (DIFFICULTIES.find((item) => item.value === value) || {}).label || '入门';
}

function buildSharePayload(type = 'friend') {
  const elapsed = formatElapsed(getElapsedSec());
  const mistakes = state ? Number(state.mistakeCount || 0) : 0;
  const diffLabel = getDifficultyLabel(difficulty);
  const title = state && state.isSolved
    ? `我在数独库通关了${diffLabel}难度，用时${elapsed}！`
    : `来挑战数独库${diffLabel}难度，当前用时${elapsed}（错误${mistakes}/${MISTAKE_LIMIT}）`;
  const query = `difficulty=${encodeURIComponent(difficulty)}&from=${type}`;

  return {
    title,
    query,
    imageUrl: SHARE_IMAGE_URL
  };
}

function setupShareMenu() {
  if (typeof wx.showShareMenu === 'function') {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }

  if (typeof wx.onShareAppMessage === 'function') {
    wx.onShareAppMessage(() => buildSharePayload('friend'));
  }

  if (typeof wx.onShareTimeline === 'function') {
    wx.onShareTimeline(() => {
      const payload = buildSharePayload('timeline');
      return {
        title: payload.title,
        query: payload.query,
        imageUrl: payload.imageUrl
      };
    });
  }
}

function formatElapsed(sec) {
  const safe = Math.max(0, Number(sec) || 0);
  const min = String(Math.floor(safe / 60)).padStart(2, '0');
  const second = String(safe % 60).padStart(2, '0');
  return `${min}:${second}`;
}

function getElapsedSec() {
  if (!state || !state.startedAt) return 0;
  return Math.floor((Date.now() - state.startedAt) / 1000);
}

function reportRuntimeError(prefix, err) {
  const raw = err && (err.stack || err.errMsg || err.message || String(err));
  const message = String(raw || '').split('\n').filter(Boolean).slice(0, 2).join(' | ') || '未知错误';
  statusText = `${prefix}: ${message}`;
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(`[MiniGame] ${prefix}`, err);
  }
}

function adaptScreen() {
  const sys = wx.getSystemInfoSync();
  ratio = sys.pixelRatio || 1;
  canvas.width = sys.windowWidth * ratio;
  canvas.height = sys.windowHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const margin = 16;
  const safeTop = sys.safeArea && Number.isFinite(sys.safeArea.top) ? sys.safeArea.top : 0;
  const headerTop = Math.max(16, safeTop + 8);
  titleX = margin;
  titleY = headerTop + 18;

  const tabsTop = titleY + 16;
  const tabsWidth = sys.windowWidth - margin * 2;
  const tabW = (tabsWidth - 6) / 4;

  difficultyButtons = DIFFICULTIES.map((item, index) => ({
    ...item,
    x: margin + index * (tabW + 2),
    y: tabsTop,
    w: tabW,
    h: 34
  }));

  const metaTop = tabsTop + 46;
  actionButtons = [
    { label: '新局', action: 'new', x: margin, y: metaTop + 44, w: 72, h: 34 },
    { label: '提示', action: 'hint', x: margin + 82, y: metaTop + 44, w: 72, h: 34 },
    { label: '检查', action: 'check', x: margin + 164, y: metaTop + 44, w: 72, h: 34 }
  ];

  gridSize = Math.min(sys.windowWidth - margin * 2, sys.windowHeight * 0.5);
  cellSize = gridSize / 9;
  originX = (sys.windowWidth - gridSize) / 2;
  originY = metaTop + 88;

  numButtons = [];
  const bw = (sys.windowWidth - margin * 2 - 16) / 5;
  const bh = 42;
  const padTop = originY + gridSize + 36;

  for (let i = 0; i < 9; i += 1) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    numButtons.push({
      label: String(i + 1),
      value: i + 1,
      x: margin + col * (bw + 4),
      y: padTop + row * (bh + 8),
      w: bw,
      h: bh
    });
  }

  numButtons.push({
    label: '清空',
    value: 0,
    x: margin + 4 * (bw + 4),
    y: padTop + bh + 8,
    w: bw,
    h: bh
  });
}

function startNewGame(nextDifficulty = difficulty) {
  difficulty = nextDifficulty;
  const result = game.newGame({ difficulty });
  if (!result.ok) {
    statusText = '题库加载失败';
    return;
  }
  state = result.state;
  selected = -1;
  const diffLabel = getDifficultyLabel(difficulty);
  statusText = `${diffLabel}难度开始，祝你通关！`;
}

function refreshState() {
  const current = game.getState();
  if (current) state = current;
}

function hitTest(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function onTap(x, y) {
  for (const tab of difficultyButtons) {
    if (hitTest(x, y, tab)) {
      startNewGame(tab.value);
      return;
    }
  }

  for (const btn of actionButtons) {
    if (hitTest(x, y, btn)) {
      if (btn.action === 'new') {
        startNewGame(difficulty);
      } else if (btn.action === 'hint') {
        const res = game.hint();
        statusText = res.ok ? '已填入一个提示' : '当前盘面无法提示';
        refreshState();
      } else if (btn.action === 'check') {
        const res = game.check();
        if (!res.ok) {
          statusText = '检查失败';
        } else if (res.isSolved) {
          statusText = '恭喜通关！';
        } else if (res.conflicts.length > 0) {
          statusText = '有冲突格，请修正';
        } else {
          statusText = '当前无冲突';
        }
        refreshState();
      }
      return;
    }
  }

  const inGrid = x >= originX && x <= originX + gridSize && y >= originY && y <= originY + gridSize;
  if (inGrid) {
    const c = Math.floor((x - originX) / cellSize);
    const r = Math.floor((y - originY) / cellSize);
    selected = r * 9 + c;
    return;
  }

  for (const btn of numButtons) {
    if (hitTest(x, y, btn)) {
      if (selected < 0) {
        statusText = '请先选中一个格子';
        return;
      }
      const result = btn.value === 0 ? game.erase(selected) : game.input(selected, btn.value);
      refreshState();
      if (result.ok) {
        statusText = '已更新';
      } else {
        const mistakes = state ? state.mistakeCount : 0;
        statusText = mistakes >= MISTAKE_LIMIT
          ? `错误已达 ${MISTAKE_LIMIT} 次，请小心填写`
          : `填写错误（${mistakes}/${MISTAKE_LIMIT}）`;
      }
      return;
    }
  }
}

function getTouchPoint(touch) {
  if (!touch || typeof touch !== 'object') return null;
  const x = Number.isFinite(touch.clientX)
    ? touch.clientX
    : Number.isFinite(touch.x)
      ? touch.x
      : Number.isFinite(touch.pageX)
        ? touch.pageX
        : Number.isFinite(touch.screenX)
          ? touch.screenX
          : NaN;
  const y = Number.isFinite(touch.clientY)
    ? touch.clientY
    : Number.isFinite(touch.y)
      ? touch.y
      : Number.isFinite(touch.pageY)
        ? touch.pageY
        : Number.isFinite(touch.screenY)
          ? touch.screenY
          : NaN;

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function drawRoundRect(x, y, w, h, radius, color) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function draw() {
  if (!state) return;

  const w = canvas.width / ratio;
  const h = canvas.height / ratio;
  const elapsed = formatElapsed(getElapsedSec());
  const mistakes = Number(state.mistakeCount || 0);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f6f8fb';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#222';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('数独库 · 腾讯小游戏', titleX, titleY);

  for (const tab of difficultyButtons) {
    drawRoundRect(tab.x, tab.y, tab.w, tab.h, 10, tab.value === difficulty ? '#246BFD' : '#e5eaf3');
    ctx.fillStyle = tab.value === difficulty ? '#fff' : '#324155';
    ctx.font = '14px sans-serif';
    ctx.fillText(tab.label, tab.x + tab.w * 0.32, tab.y + 22);
  }

  drawRoundRect(16, titleY + 62, 120, 34, 10, '#e9eef7');
  ctx.fillStyle = '#334155';
  ctx.font = '14px sans-serif';
  ctx.fillText(`⏱ ${elapsed}`, 28, titleY + 84);

  const errorColor = mistakes >= MISTAKE_LIMIT ? '#fee2e2' : '#e9eef7';
  drawRoundRect(w - 136, titleY + 62, 120, 34, 10, errorColor);
  ctx.fillStyle = mistakes >= MISTAKE_LIMIT ? '#b91c1c' : '#334155';
  ctx.fillText(`❌ ${mistakes}/${MISTAKE_LIMIT}`, w - 122, titleY + 84);

  for (const btn of actionButtons) {
    drawRoundRect(btn.x, btn.y, btn.w, btn.h, 8, '#246BFD');
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(btn.label, btn.x + 20, btn.y + 22);
  }

  for (let i = 0; i < 81; i += 1) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const x = originX + c * cellSize;
    const y = originY + r * cellSize;

    if (i === selected) {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(x, y, cellSize, cellSize);
    } else if (state.givensMask[i]) {
      ctx.fillStyle = '#eff2f7';
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    if (state.conflicts.includes(i)) {
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    const value = state.grid[i];
    if (value !== 0) {
      ctx.fillStyle = state.givensMask[i] ? '#111827' : '#1d4ed8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(String(value), x + cellSize * 0.38, y + cellSize * 0.68);
    }
  }

  for (let i = 0; i <= 9; i += 1) {
    ctx.beginPath();
    ctx.moveTo(originX, originY + i * cellSize);
    ctx.lineTo(originX + gridSize, originY + i * cellSize);
    ctx.strokeStyle = i % 3 === 0 ? '#334155' : '#cbd5e1';
    ctx.lineWidth = i % 3 === 0 ? 2 : 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originX + i * cellSize, originY);
    ctx.lineTo(originX + i * cellSize, originY + gridSize);
    ctx.strokeStyle = i % 3 === 0 ? '#334155' : '#cbd5e1';
    ctx.lineWidth = i % 3 === 0 ? 2 : 1;
    ctx.stroke();
  }

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#3b4a5a';
  ctx.fillText(statusText, 16, originY + gridSize + 20);

  for (const btn of numButtons) {
    drawRoundRect(btn.x, btn.y, btn.w, btn.h, 8, '#ffffff');
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = '#0f172a';
    ctx.font = '16px sans-serif';
    const tx = btn.label.length === 1 ? btn.x + btn.w * 0.46 : btn.x + btn.w * 0.3;
    ctx.fillText(btn.label, tx, btn.y + 27);
  }
}

function loop() {
  draw();
  if (canvas && typeof canvas.requestAnimationFrame === 'function') {
    canvas.requestAnimationFrame(loop);
    return;
  }
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(loop);
    return;
  }
  setTimeout(loop, 16);
}

if (typeof wx.onError === 'function') {
  wx.onError((err) => {
    reportRuntimeError('运行异常', err);
  });
}

if (typeof wx.onUnhandledRejection === 'function') {
  wx.onUnhandledRejection((err) => {
    reportRuntimeError('异步异常', err);
  });
}

adaptScreen();
setupShareMenu();
startNewGame('beginner');
loop();

wx.onTouchStart((event) => {
  const touch = event.touches[0];
  const point = getTouchPoint(touch);
  if (!point) return;
  onTap(point.x, point.y);
});
