// Color wheel: apply the picked color to the note [色环 - 应用选中颜色到笔记]

import { changeNoteColor } from '../../note/scripts/note-operations.js';
import { hsvToHex } from './color-convert.js';
import { getHsv } from './wheel-state-store.js';
import { updateDisplay } from './wheel-display.js';

/**
 * Update display and apply selected color to the note [更新显示并应用选中颜色到笔记]
 */
export function applyColor(): void {
  updateDisplay();
  const { h: hue, s: sat, v: val } = getHsv();
  void changeNoteColor(hsvToHex(hue, sat, val));
}
