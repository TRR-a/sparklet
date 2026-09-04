// Note quick jump - Ctrl+digit switches to the Nth visible note [笔记快速跳转 - Ctrl+数字切换到第 N 个可见笔记]
//
// Behavior [行为]：
//   - Hold Ctrl alone: first 10 visible cards show a gray "Ctrl 1"~"Ctrl 0" chip [单按住 Ctrl：前 10 个可见卡片旁显示灰色角标]
//   - Ctrl+1..9 / Ctrl+0 jumps to the corresponding note [Ctrl+1..9 / Ctrl+0 跳转到对应笔记]
//   - Order = visual order of the note list (pinned → starred → recent), collapsed groups excluded [顺序 = 笔记列表显示顺序 (置顶→星标→最近)，折叠分组不参与]
//   - Any other key or Ctrl release hides the chips [按其他键或松开 Ctrl 隐藏角标]

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
  const ids = ['customConfirmModal', 'noteInfoModal', 'exitConfirmModal'];
  return ids.some(id => {
    const el = document.getElementById(id);
    return el !== null && (el as HTMLElement).style.display !== 'none';
  });
}

/**
 * Get visible note cards in visual order (collapsed groups filtered) [按显示顺序获取可见笔记卡片 (过滤折叠分组)]
 */
function getVisibleCards(): HTMLElement[] {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('#noteList .note-list-item'));
  // offsetParent is null when hidden by a collapsed group [折叠分组隐藏时 offsetParent 为 null]
  return cards.filter(card => card.offsetParent !== null);
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
 * Show "Ctrl N" chips on the first 10 visible cards [在前 10 个可见卡片上显示 Ctrl N 角标]
 */
function showHints(): void {
  if (hintsVisible) return;
  const cards = getVisibleCards().slice(0, 10);
  cards.forEach((card, i) => {
    const hint = document.createElement('span');
    hint.className = HINT_CLASS;
    hint.textContent = i === 9 ? 'Ctrl 0' : `Ctrl ${i + 1}`;
    card.appendChild(hint);
  });
  hintsVisible = cards.length > 0;
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
  const card = getVisibleCards()[index];
  if (!card) return;
  const noteId = card.getAttribute('data-note-id');
  if (!noteId) return;
  // Dynamic import to avoid circular dependency (same as note-card.ts) [动态导入避免循环依赖 (与 note-card.ts 相同)]
  const { switchNote } = await import('./note-editor.js');
  void switchNote(noteId);
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
