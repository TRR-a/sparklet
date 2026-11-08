// custom-dropdown.ts - Replace native <select> with a glassmorphism dropdown
// [用玻璃拟态自定义下拉替换原生 <select>]
// Keeps the original <select> in the DOM (hidden) so existing .value reads
// and 'change' listeners keep working untouched.
// [保留原 <select> 在 DOM 中（隐藏），现有 .value 读取和 'change' 监听无需改动]
//
// Split out [已拆分]：panel rebuild → glass-dropdown-panel.ts,
// placement → glass-dropdown-position.ts, label sync → glass-dropdown-label.ts,
// instance class → glass-dropdown-instance.ts.

import { GlassDropdown } from './glass-dropdown-instance.js';

/** Upgrade every <select class="language-select"> (and updater selects) on the page [将页面上所有 <select> 升级为玻璃下拉] */
export function initCustomDropdowns(): void {
  document.querySelectorAll<HTMLSelectElement>('select.language-select, .updater-group select').forEach((sel) => {
    new GlassDropdown(sel);
  });
}
