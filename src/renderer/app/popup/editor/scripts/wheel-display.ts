// Color wheel: preview / hex label / cursor dot [色环 - 预览、色值与指示点]

import { hsvToHex } from './color-convert.js';
import { getHsv } from './wheel-state-store.js';

/**
 * Update preview / hex label / cursor dot [更新预览、色值与指示点]
 */
export function updateDisplay(): void {
  const { h: hue, s: sat, v: val } = getHsv();
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
