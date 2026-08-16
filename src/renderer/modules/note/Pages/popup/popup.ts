// Popup page - Sparklet main popup logic entry point [弹窗页面 - Sparklet 主弹窗逻辑入口]
// Handles note editing, theme switching, trash, settings window glow sync [处理笔记编辑、主题切换、回收站、设置窗口光晕同步]

import storageManager from '../../Modules/storage-manager.js';
import { initI18n, t } from '../../Modules/i18n.js';
import { showToast, bindToastListener } from '../../Base/toast.js';
import { setTheme, toggleTheme } from '../../Base/theme.js';
import {
  loadNotes,
  saveCurrentNote,
  debounceSave,
  createNewNote,
  changeNoteColor,
  loadNoteIntoEditor,
  renderNoteList,
  getCurrentNoteId,
  setCurrentNoteId
} from './note-editor.js';
import { toggleTrashView } from './trash-view.js';

/**
 * Bind all popup events [绑定所有弹窗事件]
 */
function bindEvents(): void {
  const themeToggleBtn = document.getElementById('themeToggle');
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

  const trashToggleBtn = document.getElementById('trashToggle');
  if (trashToggleBtn) trashToggleBtn.addEventListener('click', toggleTrashView);

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      document.body.classList.add('blur-background');
      const glowMask = document.getElementById('settingsGlowMask');
      if (glowMask) glowMask.classList.add('show');
      await window.electronAPI.invoke('open-settings-window');
    });
  }

  const minimizeBtn = document.querySelector('.window-btn.minimize');
  const maximizeBtn = document.querySelector('.window-btn.maximize');
  const closeBtn = document.querySelector('.window-btn.close');
  if (minimizeBtn) minimizeBtn.addEventListener('click', () => window.electronAPI.invoke('window-minimize'));
  if (maximizeBtn) maximizeBtn.addEventListener('click', () => window.electronAPI.invoke('window-maximize'));
  if (closeBtn) closeBtn.addEventListener('click', () => window.electronAPI.invoke('window-close'));

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

  // Settings window glow position sync [设置窗口光晕位置同步]
  window.electronAPI.on('settings-window-moved', (...args: unknown[]) => {
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

  window.electronAPI.on('settings-window-overlap', (...args: unknown[]) => {
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
  const theme = await window.electronStore.get('theme') as string | undefined;
  setTheme(theme || 'light');
  bindEvents();
  await loadNotes();
  // Toast listener (from main process) [Toast 监听 (来自主进程)]
  bindToastListener('提示');
  console.log('Sparklet 初始化完成');
}

// DOMContentLoaded [DOM 加载完成]
document.addEventListener('DOMContentLoaded', initApp);

// Expose debug function [暴露调试函数]
(window as unknown as { debugStorage: () => Promise<unknown> }).debugStorage = () => storageManager.debug();

// ==================== Window state listeners [窗口状态监听] ====================
window.electronAPI.on('settings-window-closed', () => {
  document.body.classList.remove('blur-background');
  const glowMask = document.getElementById('settingsGlowMask');
  if (glowMask) glowMask.classList.remove('show');
});

window.electronAPI.on('settings-window-minimized', () => {
  document.body.classList.remove('blur-background');
  const glowMask = document.getElementById('settingsGlowMask');
  if (glowMask) glowMask.classList.remove('show');
});

window.electronAPI.on('settings-window-restored', () => {
  document.body.classList.add('blur-background');
  const glowMask = document.getElementById('settingsGlowMask');
  if (glowMask) glowMask.classList.add('show');
});
