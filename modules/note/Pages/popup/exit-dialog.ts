// Exit confirm dialog - double-Esc trigger, keyboard navigation, save-before-quit [退出确认弹窗 - 双击 Esc 唤起、键盘导航、退出前保存]
//
// Behavior [行为]：
//   - Press Esc twice quickly (within 600ms) to show the dialog [快速连按两次 Esc 弹出弹窗]
//   - Dialog open: ←/→ switch focus, Enter activates, Esc = return (close) [弹窗中：←/→ 切换焦点、Enter 激活、Esc = 返回 (关闭)]
//   - Default focused button is "Return" so Enter alone never quits [默认焦点在「返回」，单按 Enter 不会退出]
//   - Quit saves all unsaved content (note + project file) before quitting [退出前先保存所有未保存内容 (笔记 + 项目文件)]

import { windowApi } from '../../../../src/renderer/core/index.js';
import { saveCurrentNote } from './note-editor.js';
import { saveCurrentFile } from '../../../../src/renderer/modules/project/project-view.js';

/** Double-Esc detection window in ms [双击 Esc 判定时间窗口 (毫秒)] */
const DOUBLE_ESC_INTERVAL = 600;

/** Focused button index: 0 = return, 1 = quit [焦点按钮索引：0=返回, 1=退出] */
let focusedIndex = 0;

/** Dialog open state [弹窗打开状态] */
let isDialogOpen = false;

/** Timestamp of last Esc press [上次按 Esc 的时间戳] */
let lastEscTime = 0;

function getModal(): HTMLElement | null {
  return document.getElementById('exitConfirmModal');
}

function getReturnBtn(): HTMLElement | null {
  return document.getElementById('exitReturnBtn');
}

function getQuitBtn(): HTMLElement | null {
  return document.getElementById('exitQuitBtn');
}

/**
 * Check if another modal is currently open (its Esc handling wins over double-Esc) [检查是否有其他弹窗打开 (它们的 Esc 优先于双击检测)]
 */
function isOtherModalOpen(): boolean {
  const ids = ['customConfirmModal', 'noteInfoModal'];
  return ids.some(id => {
    const el = document.getElementById(id);
    return el !== null && (el as HTMLElement).style.display !== 'none';
  });
}

/**
 * Update focused-button highlight ring [更新焦点按钮高亮描边]
 */
function updateFocus(): void {
  const returnBtn = getReturnBtn();
  const quitBtn = getQuitBtn();
  if (returnBtn) returnBtn.classList.toggle('focused', focusedIndex === 0);
  if (quitBtn) quitBtn.classList.toggle('focused', focusedIndex === 1);
}

/**
 * Save all unsaved content before quitting [退出前保存所有未保存内容]
 * Best-effort: a single save failure is logged but does not block quit [尽力而为：单项保存失败仅记录日志，不阻塞退出]
 */
async function saveAllBeforeQuit(): Promise<void> {
  try {
    await saveCurrentNote();
  } catch (err) {
    console.warn('[ExitDialog] Failed to save note before quit:', err);
  }
  try {
    await saveCurrentFile();
  } catch (err) {
    console.warn('[ExitDialog] Failed to save project file before quit:', err);
  }
}

/**
 * Close the dialog (return action, no quit) [关闭弹窗 (返回动作，不退出)]
 */
function closeDialog(): void {
  isDialogOpen = false;
  const modal = getModal();
  if (modal) (modal as HTMLElement).style.display = 'none';
}

/**
 * Perform quit: save everything then quit the app [执行退出：先保存全部内容再退出应用]
 */
async function performQuit(): Promise<void> {
  await saveAllBeforeQuit();
  await windowApi.quitApp();
}

/**
 * Show the exit confirm dialog [显示退出确认弹窗]
 */
function showExitDialog(): void {
  isDialogOpen = true;
  focusedIndex = 0; // Default highlight = return [默认高亮返回]
  updateFocus();
  const modal = getModal();
  if (modal) (modal as HTMLElement).style.display = 'flex';
  // Move focus onto the dialog so Enter doesn't leak into note editor [把焦点移入弹窗，避免 Enter 泄漏进笔记编辑器]
  getReturnBtn()?.focus();
}

/**
 * Global keydown handler (capture phase to win over editor key bindings) [全局按键处理器 (capture 阶段优先于编辑器按键绑定)]
 */
function onKeyDown(e: KeyboardEvent): void {
  if (isDialogOpen) {
    // Dialog open: full keyboard navigation [弹窗打开：完整键盘导航]
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeDialog(); // Esc on any button = return [任意按钮上按 Esc 都执行返回]
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      focusedIndex = 1 - focusedIndex; // Toggle between return (0) and quit (1) [在返回 (0) 与退出 (1) 间切换]
      updateFocus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (focusedIndex === 0) closeDialog();
      else void performQuit();
    }
    return;
  }

  // Double-Esc detection (skipped while other modals are open) [双击 Esc 检测 (其他弹窗打开时跳过)]
  if (e.key === 'Escape' && !isOtherModalOpen()) {
    const now = Date.now();
    if (now - lastEscTime < DOUBLE_ESC_INTERVAL) {
      lastEscTime = 0;
      showExitDialog();
    } else {
      lastEscTime = now;
    }
  }
}

/**
 * Bind exit-confirm dialog events (call once on init) [绑定退出确认弹窗事件 (初始化时调用一次)]
 */
export function initExitDialog(): void {
  document.addEventListener('keydown', onKeyDown, true);

  const returnBtn = getReturnBtn();
  const quitBtn = getQuitBtn();
  if (returnBtn) returnBtn.addEventListener('click', closeDialog);
  if (quitBtn) quitBtn.addEventListener('click', () => void performQuit());

  // Overlay background click does NOT close: fixed-center design requires explicit choice [点击遮罩不关闭：固定居中设计要求显式选择]
  const modal = getModal();
  if (modal) {
    modal.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === modal) e.preventDefault(); // swallow, no close [吞掉事件，不关闭]
    });
  }
}
