// Popup page - Sparklet main popup logic entry point [弹窗页面 - Sparklet 主弹窗逻辑入口]
// Handles note editing, theme switching, trash, settings window glow sync [处理笔记编辑、主题切换、回收站、设置窗口光晕同步]

import storageManager from '../../Modules/storage-manager.js';
import { initI18n } from '../../Modules/i18n.js';
import { bindToastListener } from '../../Base/toast.js';
import { setTheme, bindThemeBroadcastListener } from '../../Base/theme.js';
import { storeApi, windowApi } from '../../../../src/renderer/core/index.js';
import {
  loadNotes,
  saveCurrentNote,
  debounceSave,
  createNewNote,
  changeNoteColor,
} from './note-editor.js';
import { toggleTrashView } from './trash-view.js';
import { initExitDialog } from './exit-dialog.js';
import { initNoteQuickJump } from './note-quick-jump.js';
import { initNoteSearch } from './note-search.js';
import { initShortcutPanel } from './shortcut-panel.js';
import { initGlobalShortcuts } from './global-shortcuts.js';
import { initVirtualList } from './note-virtual-list.js';
import { openProjectFolder, restoreWorkspace, closeFilePreview } from '../../../../src/renderer/modules/project/project-view.js';

/**
 * Bind all popup events [绑定所有弹窗事件]
 */
function bindEvents(): void {
  const trashToggleBtn = document.getElementById('trashToggle');
  if (trashToggleBtn) trashToggleBtn.addEventListener('click', toggleTrashView);

  const openFolderBtn = document.getElementById('openFolderBtn');
  if (openFolderBtn) openFolderBtn.addEventListener('click', openProjectFolder);

  const filePreviewClose = document.getElementById('filePreviewClose');
  if (filePreviewClose) filePreviewClose.addEventListener('click', closeFilePreview);

  const windowPinBtn = document.getElementById('windowPinBtn');
  if (windowPinBtn) {
    windowPinBtn.addEventListener('click', async () => {
      const isOnTop = await windowApi.toggleAlwaysOnTop();
      windowPinBtn.classList.toggle('active', isOnTop);
    });
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      document.body.classList.add('blur-background');
      const glowMask = document.getElementById('settingsGlowMask');
      if (glowMask) glowMask.classList.add('show');
      await windowApi.openSettings();
    });
  }

  const minimizeBtn = document.querySelector('.window-btn.minimize');
  const maximizeBtn = document.querySelector('.window-btn.maximize');
  const closeBtn = document.querySelector('.window-btn.close');
  if (minimizeBtn) minimizeBtn.addEventListener('click', () => void windowApi.minimize());
  if (maximizeBtn) maximizeBtn.addEventListener('click', () => void windowApi.maximize());
  if (closeBtn) closeBtn.addEventListener('click', () => void windowApi.close());

  const newNoteBtn = document.getElementById('newNoteBtn');
  if (newNoteBtn) newNoteBtn.addEventListener('click', createNewNote);

  const colorPalette = document.querySelectorAll('.color-option');
  colorPalette.forEach(btn => {
    btn.addEventListener('click', () => changeNoteColor(btn.getAttribute('data-color') || ''));
  });

  const titleInput = document.getElementById('noteTitle');
  const contentInput = document.getElementById('noteArea');
  if (titleInput) titleInput.addEventListener('input', debounceSave);
  if (contentInput) contentInput.addEventListener('input', debounceSave);

  window.addEventListener('blur', saveCurrentNote);

  // Safety: clear stale blur-background on focus (query main process for settings window status) [安全：获得焦点时清除残留 blur-background (向主进程查询设置窗口状态)]
  window.addEventListener('focus', async () => {
    const isSettingsOpen = await windowApi.isSettingsOpen();
    if (!isSettingsOpen) {
      document.body.classList.remove('blur-background');
      const glowMask = document.getElementById('settingsGlowMask');
      if (glowMask) glowMask.classList.remove('show');
    }
  });

  // Settings window glow position sync [设置窗口光晕位置同步]
  windowApi.onSettingsMoved((...args: unknown[]) => {
    const data = args[0] as { mainBounds: { x: number; y: number }; settingsBounds: { x: number; y: number; width: number; height: number } };
    const glowMask = document.getElementById('settingsGlowMask');
    if (!glowMask) return;
    const relativeLeft = data.settingsBounds.x - data.mainBounds.x;
    const relativeTop = data.settingsBounds.y - data.mainBounds.y;
    (glowMask as HTMLElement).style.left = `${relativeLeft}px`;
    (glowMask as HTMLElement).style.top = `${relativeTop}px`;
    (glowMask as HTMLElement).style.width = `${data.settingsBounds.width}px`;
    (glowMask as HTMLElement).style.height = `${data.settingsBounds.height}px`;
  });

  windowApi.onSettingsOverlap((...args: unknown[]) => {
    const isOverlapping = args[0] as boolean;
    const glowMask = document.getElementById('settingsGlowMask');
    if (isOverlapping) {
      document.body.classList.add('blur-background');
      if (glowMask) glowMask.classList.add('show');
    } else {
      document.body.classList.remove('blur-background');
      if (glowMask) glowMask.classList.remove('show');
    }
  });
}

/**
 * Initialize the popup app [初始化弹窗应用]
 */
async function initApp(): Promise<void> {
  console.log('Sparklet 初始化...');
  await storageManager.init();
  await initI18n();
  const theme = await storeApi.get<string>('theme');
  setTheme(theme || 'light');
  bindThemeBroadcastListener();
  bindEvents();
  initExitDialog(); // Double-Esc exit confirm dialog [双击 Esc 退出确认弹窗]
  initNoteQuickJump(); // Ctrl+digit quick jump to first 10 visible notes [Ctrl+数字快速跳转前 10 个可见笔记]
  initVirtualList(); // Virtual list scroll/resize listeners [虚拟列表滚动/缩放监听]
  initNoteSearch(); // Sidebar full-text search box [侧栏全文搜索框]
  initShortcutPanel(); // Keyboard shortcut panel (⌨️ / F1) [快捷键面板 (⌨️ / F1)]
  initGlobalShortcuts(); // Ctrl+F / Ctrl+N / Ctrl+P [全局快捷键]
  await loadNotes();
  await restoreWorkspace();
  // Toast listener (from main process) [Toast 监听 (来自主进程)]
  bindToastListener('提示');
  console.log('Sparklet 初始化完成');
}

// DOMContentLoaded [DOM 加载完成]
document.addEventListener('DOMContentLoaded', initApp);

// Expose debug function [暴露调试函数]
(window as unknown as { debugStorage: () => Promise<unknown> }).debugStorage = () => storageManager.debug();

// ==================== Window state listeners [窗口状态监听] ====================
windowApi.onSettingsClosed(() => {
  document.body.classList.remove('blur-background');
  const glowMask = document.getElementById('settingsGlowMask');
  if (glowMask) glowMask.classList.remove('show');
});

windowApi.onSettingsMinimized(() => {
  document.body.classList.remove('blur-background');
  const glowMask = document.getElementById('settingsGlowMask');
  if (glowMask) glowMask.classList.remove('show');
});

windowApi.onSettingsRestored(() => {
  document.body.classList.add('blur-background');
  const glowMask = document.getElementById('settingsGlowMask');
  if (glowMask) glowMask.classList.add('show');
});
