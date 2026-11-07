// Shortcut panel: content builder [快捷键面板 - 内容构建]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { SHORTCUT_GROUPS } from './shortcut-panel-data.js';

/**
 * Build the panel content from i18n (called on every open, so language switches apply) [从 i18n 构建面板内容 (每次打开时构建，语言切换后生效)]
 */
export function buildPanelContent(): void {
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
