// Color wheel: picking [色环 - 取色]

import { readHsv, setHsv } from 'sparklet/renderer/app/popup/editor/wheel/scripts/wheel-state-store.js';
import { applyColor } from 'sparklet/renderer/app/popup/editor/wheel/scripts/wheel-apply.js';

/**
 * Pick color at canvas coords [根据 canvas 坐标取色]
 */
export function pickAt(canvas: HTMLCanvasElement, clientX: number, clientY: number): void {
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
  setHsv(h, dist, readHsv().v);
  applyColor();
}
