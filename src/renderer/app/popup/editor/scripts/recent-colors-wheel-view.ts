// Recent colors: wheel popover grid [最近颜色 - 色环弹层网格]

import { loadRecentColors } from './recent-colors-store.js';
import { reuseRecentColor } from './recent-colors-reuse.js';

/**
 * Render the recent-color grid inside the wheel popover (2 rows x 5, hidden when empty)
 * [渲染色环弹层内的最近颜色网格（2x5，为空时隐藏）]
 */
export async function renderRecentColors(canvas: HTMLCanvasElement): Promise<void> {
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
