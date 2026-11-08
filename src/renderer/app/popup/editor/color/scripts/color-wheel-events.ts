// Color wheel: canvas pick + value slider events [色环 - 画布选色与明度滑块事件]

import { setValue, drawWheel, pickAt, applyColor } from 'sparklet/renderer/app/popup/editor/color/scripts/color-wheel-state.js';

/**
 * Bind disc picking and brightness slider [绑定圆盘选色与明度滑块]
 * @param canvas Wheel canvas [色环画布]
 * @param valueSlider Value slider [明度滑块]
 * @param commitRecent Called when a pick is committed to the recent list [选色提交到最近颜色列表时的回调]
 */
export function bindWheelEvents(
  canvas: HTMLCanvasElement,
  valueSlider: HTMLInputElement,
  commitRecent: () => void
): void {
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
    setValue(Number(valueSlider.value) / 100);
    drawWheel(canvas);
    applyColor();
  });
  valueSlider.addEventListener('change', () => {
    commitRecent();
  });
}
