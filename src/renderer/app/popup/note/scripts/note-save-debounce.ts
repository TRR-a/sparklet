// Note save: debounced save timers [笔记保存 - 防抖定时器]

/** Save debounce delay [保存防抖延迟] */
const SAVE_DEBOUNCE_MS = 800;

/**
 * Max wait before a continuous typing session is force-saved
 * [连续输入时的最大等待，超时强制落盘 (防抖定时器随按键不断重置，否则持续打字永不保存)]
 */
const SAVE_MAX_WAIT_MS = 5000;

/** Trailing debounce timer [尾随防抖定时器] */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/** Max-wait force-save timer [最大等待强制保存定时器] */
let maxWaitTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Clear pending save timers [清理待触发的保存定时器]
 */
export function clearSaveTimers(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  if (maxWaitTimeout) {
    clearTimeout(maxWaitTimeout);
    maxWaitTimeout = null;
  }
}

/**
 * Debounced save: 800ms trailing + 5s max wait
 * [防抖保存：800ms 尾随触发 + 连续输入最多 5s 强制落盘]
 */
export function debounceSave(save: () => void): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    save();
  }, SAVE_DEBOUNCE_MS);

  if (!maxWaitTimeout) {
    maxWaitTimeout = setTimeout(() => {
      maxWaitTimeout = null;
      save();
    }, SAVE_MAX_WAIT_MS);
  }
}
