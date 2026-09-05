// Shortcut panel - keyboard shortcut cheat-sheet modal [快捷键面板 - 键盘快捷键速查弹窗]
//
// Opens via the ⌨️ title-bar button, F1 (bound in global-shortcuts.ts) or this module's
// toggle; closes via Esc, overlay click or the close button [经标题栏 ⌨️ 按钮、F1 (在
// global-shortcuts.ts 绑定) 或本模块的切换函数打开；Esc、点遮罩或关闭按钮关闭]

import { t } from '../../Modules/i18n.js';

/** Shortcut entry definition [快捷键条目定义] */
interface ShortcutEntry {
  /** Key combo displayed in the kbd chip [kbd 徽章中显示的组合键] */
  keys: string;
  /** i18n key of the action label [动作标签的 i18n 键] */
  labelKey: string;
}

/** Shortcut group definition [快捷键分组定义] */
interface ShortcutGroup {
  /** i18n key of the group title [分组标题的 i18n 键] */
  groupKey: string;
  entries: ShortcutEntry[];
}

/** All documented shortcuts [全部快捷键] */
const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    groupKey: 'shortcutPanel.groupGeneral',
    entries: [
      { keys: 'Ctrl + F', labelKey: 'shortcutPanel.action.search' },
      { keys: 'Ctrl + N', labelKey: 'shortcutPanel.action.newNote' },
      { keys: 'Ctrl + P', labelKey: 'shortcutPanel.action.preview' },
      { keys: 'F1', labelKey: 'shortcutPanel.action.shortcuts' },
      { keys: 'Esc', labelKey: 'shortcutPanel.action.closeMenu' },
    ],
  },
  {
    groupKey: 'shortcutPanel.groupNotes',
    entries: [
      { keys: 'Ctrl + 1 … 0', labelKey: 'shortcutPanel.action.quickJump' },
      { keys: 'Ctrl', labelKey: 'shortcutPanel.action.quickJumpHints' },
      { keys: 'Esc Esc', labelKey: 'shortcutPanel.action.exit' },
    ],
  },
];

/**
 * Get the modal element [获取弹窗元素]
 */
function getModal(): HTMLElement | null {
  return document.getElementById('shortcutModal');
}

/**
 * Whether the panel is open [面板是否打开]
 */
function isPanelOpen(): boolean {
  const modal = getModal();
  return modal !== null && modal.style.display !== 'none';
}

/**
 * Build the panel content from i18n (called on every open, so language switches apply) [从 i18n 构建面板内容 (每次打开时构建，语言切换后生效)]
 */
function buildPanelContent(): void {
  const body = document.getElementById('shortcutPanelBody');
  if (!body) return;
  body.innerHTML = '';

  for (const group of SHORTCUT_GROUPS) {
    const groupEl = document.createElement('div');
    groupEl.className = 'shortcut-group';
    groupEl.innerHTML = `<div class="shortcut-group-title">${t(group.groupKey)}</div>`;

    for (const entry of group.entries) {
      const row = document.createElement('div');
      row.className = 'shortcut-row';
      row.innerHTML = `<span class="shortcut-action">${t(entry.labelKey)}</span><span class="shortcut-keys"><kbd>${entry.keys}</kbd></span>`;
      groupEl.appendChild(row);
    }
    body.appendChild(groupEl);
  }
}

/**
 * Show the shortcut panel [显示快捷键面板]
 */
function showPanel(): void {
  const modal = getModal();
  if (!modal) return;
  buildPanelContent();
  modal.style.display = 'flex';
  document.getElementById('shortcutPanelCloseBtn')?.focus();
}

/**
 * Hide the shortcut panel [隐藏快捷键面板]
 */
function hidePanel(): void {
  const modal = getModal();
  if (modal) modal.style.display = 'none';
}

/**
 * Toggle the shortcut panel [切换快捷键面板]
 */
export function toggleShortcutPanel(): void {
  if (isPanelOpen()) hidePanel();
  else showPanel();
}

/**
 * Bind shortcut panel events (call once on init) [绑定快捷键面板事件 (初始化时调用一次)]
 */
export function initShortcutPanel(): void {
  const btn = document.getElementById('shortcutBtn');
  if (btn) btn.addEventListener('click', toggleShortcutPanel);

  const closeBtn = document.getElementById('shortcutPanelCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', hidePanel);

  const modal = getModal();
  if (modal) {
    // Overlay click closes (target = overlay itself, not the box) [点击遮罩关闭 (仅遮罩本体，不含弹窗主体)]
    modal.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === modal) hidePanel();
    });
  }

  // Esc closes the panel (capture phase, before the double-Esc exit detector) [Esc 关闭面板 (capture 阶段，先于双击 Esc 退出检测)]
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isPanelOpen()) {
      e.preventDefault();
      e.stopPropagation();
      hidePanel();
    }
  }, true);
}
