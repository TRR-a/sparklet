// color-wheel.ts - 自定义 HSV 色环选择器 [Custom HSV color wheel picker]
// Canvas renders an HSV disc (hue by angle, saturation by radius); a slider
// controls value (brightness). Selecting a color calls back with a hex string.
// [Canvas 绘制 HSV 圆盘（色相=角度，饱和度=半径）；滑块控制明度。选中后以 hex 回调]

import { changeNoteColor } from './note-operations.js';
import { storeApi } from '../../../../src/renderer/core/index.js';

/** HSV -> hex [HSV 转十六进制] */
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120){ r = x; g = c; b = 0; }
  else if (h < 180){ r = 0; g = c; b = x; }
  else if (h < 240){ r = 0; g = x; b = c; }
  else if (h < 300){ r = x; g = 0; b = c; }
  else             { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Current picker state [当前选择器状态] */
let hue = 0;
let sat = 0;
let val = 1;

/** Store key for recent custom colors (persisted config file) [最近自定义颜色的存储键 (持久化配置文件)] */
const RECENT_KEY = 'recentColors';
/** Max recorded colors: 3 candidates on the palette + 10 in the wheel (2x5) [记录上限：色板 3 个候选 + 色环内 10 个 (2x5)] */
const RECENT_MAX = 10;
/** Candidate swatches shown between fixed colors and the wheel button [固定色与调色盘按钮之间显示的候选数] */
const CANDIDATE_COUNT = 3;

/**
 * hex -> HSV [十六进制转 HSV]
 */
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r)      h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else                h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

/**
 * Load recent colors from the store config file [从配置文件读取最近颜色]
 */
async function loadRecentColors(): Promise<string[]> {
  try {
    const arr = await storeApi.get<unknown>(RECENT_KEY);
    return Array.isArray(arr) ? arr.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Push a color into recent list (dedup, newest first, cap at RECENT_MAX)
 * [把颜色压入最近列表（去重、新的在前、上限 RECENT_MAX 个）]
 */
async function pushRecentColor(hex: string): Promise<void> {
  const list = (await loadRecentColors()).filter((c) => c !== hex);
  list.unshift(hex);
  await storeApi.set(RECENT_KEY, list.slice(0, RECENT_MAX));
}

/**
 * Reuse a recorded color: apply it, move it to the front, refresh both views
 * [复用记录的颜色：应用、提到最前、刷新两处显示]
 */
async function reuseRecentColor(canvas: HTMLCanvasElement, hex: string): Promise<void> {
  const { h, s, v } = hexToHsv(hex);
  hue = h; sat = s; val = v;
  const slider = document.getElementById('colorWheelValue') as HTMLInputElement | null;
  if (slider) slider.value = String(Math.round(v * 100));
  drawWheel(canvas);
  applyColor();
  await pushRecentColor(hex);
  await renderRecentColors(canvas);
  await renderCandidates();
}

/**
 * Render the recent-color grid inside the wheel popover (2 rows x 5, hidden when empty)
 * [渲染色环弹层内的最近颜色网格（2x5，为空时隐藏）]
 */
async function renderRecentColors(canvas: HTMLCanvasElement): Promise<void> {
  const wrap = document.getElementById('colorWheelRecent');
  if (!wrap) return;
  const list = await loadRecentColors();
  wrap.innerHTML = '';
  if (list.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'grid';
  for (const hex of list) {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-wheel-swatch';
    swatch.style.backgroundColor = hex;
    swatch.title = hex;
    swatch.setAttribute('aria-label', hex);
    swatch.addEventListener('click', () => { void reuseRecentColor(canvas, hex); });
    wrap.appendChild(swatch);
  }
}

/**
 * Render candidate swatches between fixed colors and the wheel button
 * (first CANDIDATE_COUNT of the recent list, hidden when no records)
 * [渲染固定色与调色盘按钮之间的候选色块（最近列表前 CANDIDATE_COUNT 个，无记录时隐藏不占位）]
 */
async function renderCandidates(): Promise<void> {
  const wrap = document.getElementById('customColorCandidates');
  if (!wrap) return;
  const list = (await loadRecentColors()).slice(0, CANDIDATE_COUNT);
  wrap.innerHTML = '';
  if (list.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'flex';
  for (const hex of list) {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-candidate';
    swatch.style.backgroundColor = hex;
    swatch.title = hex;
    swatch.setAttribute('aria-label', hex);
    swatch.addEventListener('click', () => { void changeNoteColor(hex); });
    wrap.appendChild(swatch);
  }
}

/**
 * Draw the HSV disc onto the canvas [在 canvas 上绘制 HSV 圆盘]
 */
function drawWheel(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const radius = size / 2;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cx;
      const dist = Math.sqrt(dx * dx + dy * dy) / radius;
      if (dist > 1) continue;
      let h = Math.atan2(dy, dx) * 180 / Math.PI;
      if (h < 0) h += 360;
      const hex = hsvToHex(h, dist, val);
      const idx = (y * size + x) * 4;
      data[idx]     = parseInt(hex.slice(1, 3), 16);
      data[idx + 1] = parseInt(hex.slice(3, 5), 16);
      data[idx + 2] = parseInt(hex.slice(5, 7), 16);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Pick color at canvas coords [根据 canvas 坐标取色]
 */
function pickAt(canvas: HTMLCanvasElement, clientX: number, clientY: number): void {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  const cx = canvas.width / 2;
  const dx = x - cx;
  const dy = y - cx;
  const radius = canvas.width / 2;
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy) / radius, 1);
  let h = Math.atan2(dy, dx) * 180 / Math.PI;
  if (h < 0) h += 360;
  hue = h;
  sat = dist;
  applyColor();
}

/**
 * Update preview / hex label / cursor dot [更新预览、色值与指示点]
 */
function updateDisplay(): void {
  const hex = hsvToHex(hue, sat, val);
  const preview = document.getElementById('colorWheelPreview');
  if (preview) preview.style.backgroundColor = hex;
  // Show hex value [显示 hex 色值]
  const hexLabel = document.getElementById('colorWheelHex');
  if (hexLabel) hexLabel.textContent = hex;
  // Move the cursor dot to the selected position (CSS px, 200x200 disc)
  // [移动指示点到选中位置（CSS 像素，200x200 圆盘）]
  const cursor = document.getElementById('colorWheelCursor');
  if (cursor) {
    const rad = hue * Math.PI / 180;
    const x = 100 + Math.cos(rad) * sat * 100;
    const y = 100 + Math.sin(rad) * sat * 100;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
  }
}

/**
 * Update display and apply selected color to the note [更新显示并应用选中颜色到笔记]
 */
function applyColor(): void {
  updateDisplay();
  void changeNoteColor(hsvToHex(hue, sat, val));
}

/**
 * Initialize the custom color wheel [初始化自定义色环]
 */
export function initColorWheel(): void {
  const btn = document.getElementById('customColorBtn');
  const popover = document.getElementById('colorWheelPopover') as HTMLElement | null;
  const canvas = document.getElementById('colorWheelCanvas') as HTMLCanvasElement | null;
  const valueSlider = document.getElementById('colorWheelValue') as HTMLInputElement | null;
  if (!btn || !popover || !canvas || !valueSlider) return;

  drawWheel(canvas);
  void renderRecentColors(canvas);
  void renderCandidates();
  updateDisplay(); // Sync preview/hex/cursor to initial state (no color applied) [同步初始显示，不应用颜色]

  /** Record the picked color into recent list and refresh both views [记录选中颜色并刷新两处显示] */
  const commitRecent = (): void => {
    void (async () => {
      await pushRecentColor(hsvToHex(hue, sat, val));
      await renderRecentColors(canvas);
      await renderCandidates();
    })();
  };

  // Toggle popover [切换弹层]
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = popover.style.display !== 'none';
    popover.style.display = visible ? 'none' : 'flex';
    if (!visible) {
      // Position below the button [定位到按钮下方]
      const rect = btn.getBoundingClientRect();
      popover.style.left = `${rect.left}px`;
      popover.style.top = `${rect.bottom + 6}px`;
    }
  });

  // Close on outside click [点击外部关闭]
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target as Node) && e.target !== btn) {
      popover.style.display = 'none';
    }
  });

  // Pick color on pointer down/move; commit to recent list on release
  // [指针按下/移动选色；松开时记入最近颜色]
  let dragging = false;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    pickAt(canvas, e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) pickAt(canvas, e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', () => {
    if (dragging) commitRecent();
    dragging = false;
  });

  // Value (brightness) slider; commit on release (change) [明度滑块；松手时记入最近颜色]
  valueSlider.addEventListener('input', () => {
    val = Number(valueSlider.value) / 100;
    drawWheel(canvas);
    applyColor();
  });
  valueSlider.addEventListener('change', () => {
    commitRecent();
  });
}
