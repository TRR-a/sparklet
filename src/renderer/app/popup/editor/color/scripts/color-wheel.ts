// color-wheel.ts - 自定义 HSV 色环选择器 [Custom HSV color wheel picker]
// Canvas renders an HSV disc (hue by angle, saturation by radius); a slider
// controls value (brightness). Selecting a color calls back with a hex string.
// [Canvas 绘制 HSV 圆盘（色相=角度，饱和度=半径）；滑块控制明度。选中后以 hex 回调]
//
// Conversion in color-convert.ts, state/drawing in color-wheel-state.ts,
// recent colors in color-recents.ts [转换在 color-convert.ts，状态与绘制在 color-wheel-state.ts，最近颜色在 color-recents.ts]
// Popover in color-wheel-popover.ts, pick/slider events in color-wheel-events.ts
// [弹层在 color-wheel-popover.ts，选色与滑块事件在 color-wheel-events.ts]

import { hsvToHex } from 'sparklet/renderer/app/popup/editor/color/scripts/color-convert.js';
import { getHsv, drawWheel, updateDisplay } from 'sparklet/renderer/app/popup/editor/color/scripts/color-wheel-state.js';
import { pushRecentColor, renderRecentColors, renderCandidates } from 'sparklet/renderer/app/popup/editor/color/scripts/color-recents.js';
import { bindPopoverToggle } from 'sparklet/renderer/app/popup/editor/color/scripts/color-wheel-popover.js';
import { bindWheelEvents } from 'sparklet/renderer/app/popup/editor/color/scripts/color-wheel-events.js';

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
      await pushRecentColor(hsvToHex(getHsv().h, getHsv().s, getHsv().v));
      await renderRecentColors(canvas);
      await renderCandidates();
    })();
  };

  bindPopoverToggle(btn, popover);
  bindWheelEvents(canvas, valueSlider, commitRecent);
}
