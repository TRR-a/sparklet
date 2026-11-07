// Line diff for history snapshots: render [历史快照行级差异 - 渲染]

import { escapeHtml } from 'sparklet/renderer/shared/ui/dom-utils.js';
import { diffLines } from './history-diff-lines.js';

/**
 * Render the diff (or plain preview fallback) into the detail panel
 * [渲染差异 (或退化纯预览) 到详情面板]
 */
export function renderDetail(diffEl: HTMLElement, snapshotContent: string, currentContent: string): void {
  const lines = diffLines(currentContent, snapshotContent);
  if (lines === null) {
    diffEl.innerHTML = `<div class="history-diff-fallback">${escapeHtml(snapshotContent)}</div>`;
    return;
  }
  const html = lines.map(line => {
    const cls = line.type === 'add' ? 'history-diff-add' : line.type === 'del' ? 'history-diff-del' : 'history-diff-ctx';
    const sign = line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' ';
    return `<div class="${cls}"><span class="history-diff-sign">${sign}</span><span class="history-diff-text">${escapeHtml(line.text)}</span></div>`;
  }).join('');
  diffEl.innerHTML = html || `<div class="history-diff-ctx"><span class="history-diff-sign"> </span><span class="history-diff-text"></span></div>`;
}
