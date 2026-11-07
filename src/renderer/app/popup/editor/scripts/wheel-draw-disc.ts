// Color wheel: disc drawing [色环 - 圆盘绘制]

import { hsvToHex } from './color-convert.js';
import { readHsv } from './wheel-state-store.js';

/**
 * Draw the HSV disc onto the canvas [在 canvas 上绘制 HSV 圆盘]
 */
export function drawWheel(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const radius = size / 2;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const { v: val } = readHsv();
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
