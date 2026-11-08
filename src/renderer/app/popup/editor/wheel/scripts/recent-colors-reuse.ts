// Recent colors: reuse a recorded color [最近颜色 - 复用记录的颜色]

import { hexToHsv } from '../../color/scripts/color-convert.js';
import { setHsv, drawWheel, applyColor } from '../../color/scripts/color-wheel-state.js';
import { pushRecentColor } from './recent-colors-store.js';
import { renderRecentColors } from './recent-colors-wheel-view.js';
import { renderCandidates } from './recent-colors-candidates.js';

/**
 * Reuse a recorded color: apply it, move it to the front, refresh both views
 * [复用记录的颜色：应用、提到最前、刷新两处显示]
 */
export async function reuseRecentColor(canvas: HTMLCanvasElement, hex: string): Promise<void> {
  const { h, s, v } = hexToHsv(hex);
  setHsv(h, s, v);
  const slider = document.getElementById('colorWheelValue') as HTMLInputElement | null;
  if (slider) slider.value = String(Math.round(v * 100));
  drawWheel(canvas);
  applyColor();
  await pushRecentColor(hex);
  await renderRecentColors(canvas);
  await renderCandidates();
}
