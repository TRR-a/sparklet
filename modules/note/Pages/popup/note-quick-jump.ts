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

import { getVirtualCardNoteIds, scrollNoteIntoView } from './note-virtual-list.js';

const HINT_CLASS = 'note-quick-hint';

/** Chips currently shown [角标是否显示中] */
let hintsVisible = false;

/**
 * Check whether we are in the main notes view (not trash) [是否处于主笔记视图 (非回收站)]
 */
function isMainView(): boolean {
  return !document.body.classList.contains('trash-view');
}

/**
 * Check whether any modal is open (chips disabled) [是否有弹窗打开 (弹窗时禁用角标)]
 */
function isModalOpen(): boolean {
  const ids = ['customConfirmModal', 'noteInfoModal', 'exitConfirmModal', 'shortcutModal'];
  return ids.some(id => {
    const el = document.getElementById(id);
    return el !== null && (el as HTMLElement).style.display !== 'none';
  });
}

/**
 * Map Digit/Numpad key code to quick-jump index ('0' = 10th) [数字键映射为跳转索引 ('0'=第 10 个)]
 * @returns 0-based index, or -1 if not a digit key [非数字键返回 -1]
 */
function digitIndex(code: string): number {
  const m = code.match(/^(?:Digit|Numpad)([0-9])$/);
  if (!m) return -1;
  return m[1] === '0' ? 9 : Number(m[1]) - 1;
}

/**
 * Find the DOM card of a note id (null when outside the virtual render window) [按笔记 id 查找 DOM 卡片 (虚拟窗口外返回 null)]
 */
function findCard(noteId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`#noteList .note-list-item[data-note-id="${noteId}"]`);
}

/**
 * Show "Ctrl N" chips on the first 10 visible cards [在前 10 个可见卡片上显示 Ctrl N 角标]
 */
function showHints(): void {
  if (hintsVisible) return;
  const ids = getVirtualCardNoteIds().slice(0, 10);
  let shown = false;
  ids.forEach((noteId, i) => {
    const card = findCard(noteId);
    if (!card) return; // Scrolled out of the render window [滚出渲染窗口的卡片不显示角标]
    const hint = document.createElement('span');
    hint.className = HINT_CLASS;
    hint.textContent = i === 9 ? 'Ctrl 0' : `Ctrl ${i + 1}`;
    card.appendChild(hint);
    shown = true;
  });
  hintsVisible = shown;
}

/**
 * Remove all quick-jump chips [移除所有快速跳转角标]
 */
function hideHints(): void {
  if (!hintsVisible) return;
  document.querySelectorAll('.' + HINT_CLASS).forEach(el => el.remove());
  hintsVisible = false;
}

/**
 * Jump to the Nth visible note [跳转到第 N 个可见笔记]
 */
async function jumpToIndex(index: number): Promise<void> {
  const noteId = getVirtualCardNoteIds()[index];
  if (!noteId) return;
  // Dynamic import to avoid circular dependency (same as note-card.ts) [动态导入避免循环依赖 (与 note-card.ts 相同)]
  const { switchNote } = await import('./note-editor.js');
  void switchNote(noteId);
  // Card may be outside the virtual render window - scroll it into view [卡片可能在虚拟渲染窗口外 - 滚动到可见]
  if (!findCard(noteId)) scrollNoteIntoView(noteId);
}

/**
 * Global keydown handler (capture phase) [全局按键处理器 (capture 阶段)]
 */
function onKeyDown(e: KeyboardEvent): void {
  // Bare Ctrl press → show chips [单按 Ctrl → 显示角标]
  if (e.key === 'Control' && !e.repeat) {
    if (isMainView() && !isModalOpen()) showHints();
    return;
  }
  // Ctrl + digit → quick jump (no other modifiers) [Ctrl+数字 → 快速跳转 (排除其他修饰键)]
  if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
    const index = digitIndex(e.code);
    if (index !== -1) {
      e.preventDefault();
      e.stopPropagation();
      hideHints();
      if (isMainView() && !isModalOpen()) void jumpToIndex(index);
      return;
    }
  }
  // Any other key breaks the bare-Ctrl state → hide chips [其他按键破坏纯 Ctrl 状态 → 隐藏角标]
  if (hintsVisible) hideHints();
}

/**
 * Global keyup handler [全局按键释放处理器]
 */
function onKeyUp(e: KeyboardEvent): void {
  if (e.key === 'Control') hideHints();
}

/**
 * Bind quick-jump handlers (call once on init) [绑定快速跳转处理器 (初始化时调用一次)]
 */
export function initNoteQuickJump(): void {
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('keyup', onKeyUp, true);
  // Ctrl keyup may be lost when the window loses focus [窗口失焦时 Ctrl 的 keyup 可能丢失]
  window.addEventListener('blur', hideHints);
}
