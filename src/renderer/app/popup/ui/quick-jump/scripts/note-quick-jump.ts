// Note quick jump - Ctrl+digit switches to the Nth visible note [笔记快速跳转 - Ctrl+数字切换到第 N 个可见笔记]
//
// Behavior [行为]：
//   - Hold Ctrl alone: first 10 visible cards show a gray "Ctrl 1"~"Ctrl 0" chip [单按住 Ctrl：前 10 个可见卡片旁显示灰色角标]
//   - Ctrl+1..9 / Ctrl+0 jumps to the corresponding note [Ctrl+1..9 / Ctrl+0 跳转到对应笔记]
//   - Order = virtual list model order (pinned → starred → recent), collapsed groups excluded [顺序 = 虚拟列表模型顺序 (置顶→星标→最近)，折叠分组不参与]
//   - Any other key or Ctrl release hides the chips [按其他键或松开 Ctrl 隐藏角标]
//
// The jump order comes from the virtual list data model, not the DOM, so it also works
// while scrolled deep into a large list; chips only appear on cards currently in the DOM
// window [跳转顺序来自虚拟列表数据模型而非 DOM，列表滚动很深时依然有效；角标只出现在当前 DOM 窗口内的卡片上]
//
// Split out [已拆分]：hints → note-quick-jump-hints.ts, digit/jump → note-quick-jump-target.ts,
// keydown handling → note-quick-jump-keydown.ts.

import { hideHints } from './note-quick-jump-hints.js';
import { onQuickJumpKeyDown } from './note-quick-jump-keydown.js';

/** Global keyup handler [全局按键释放处理器] */
function onKeyUp(e: KeyboardEvent): void {
  if (e.key === 'Control') hideHints();
}

/**
 * Bind quick-jump handlers (call once on init) [绑定快速跳转处理器 (初始化时调用一次)]
 */
export function initNoteQuickJump(): void {
  document.addEventListener('keydown', onQuickJumpKeyDown, true);
  document.addEventListener('keyup', onKeyUp, true);
  // Ctrl keyup may be lost when the window loses focus [窗口失焦时 Ctrl 的 keyup 可能丢失]
  window.addEventListener('blur', hideHints);
}
