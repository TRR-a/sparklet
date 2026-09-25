// color-wheel.ts - 自定义 HSV 色环选择器 [Custom HSV color wheel picker]
// Canvas renders an HSV disc (hue by angle, saturation by radius); a slider
// controls value (brightness). Selecting a color calls back with a hex string.
// [Canvas 绘制 HSV 圆盘（色相=角度，饱和度=半径）；滑块控制明度。选中后以 hex 回调]

import { changeNoteColor } from './note-operations.js';

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
  applyColor(canvas);
}

/**
 * Update preview + apply selected color [更新预览并应用选中颜色]
 */
function applyColor(canvas: HTMLCanvasElement): void {
  const hex = hsvToHex(hue, sat, val);
  const preview = document.getElementById('colorWheelPreview');
  if (preview) preview.style.backgroundColor = hex;
  void changeNoteColor(hex);
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

  // Pick color on pointer down/move [指针按下/移动选色]
  let dragging = false;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    pickAt(canvas, e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) pickAt(canvas, e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  // Value (brightness) slider [明度滑块]
  valueSlider.addEventListener('input', () => {
    val = Number(valueSlider.value) / 100;
    drawWheel(canvas);
    applyColor(canvas);
  });
}
