// Note history modal - version snapshot list + diff preview + restore [笔记历史弹窗 - 版本快照列表 + 差异预览 + 恢复]
//
// Behavior [行为]：
//   - Opened from the note card menu "历史记录" [经笔记卡片菜单"历史记录"打开]
//   - Left: snapshot list (time / title / char count), newest first [左侧快照列表 (时间/标题/字数)，时间降序]
//   - Click a snapshot → line diff vs the current note content (custom LCS, no libs)
//     [点击快照 → 与当前正文的行级差异 (自研 LCS，无第三方库)]
//   - "恢复此版本" → main process snapshots current state first, then restores
//     [恢复前主进程先快照当前状态，再写入所选版本]

import { t } from '../../Modules/i18n.js';
import { formatDateTime, escapeHtml } from '../../Base/dom-utils.js';
import { showToast } from '../../Base/toast.js';
import storageManager from '../../Modules/storage-manager.js';
import { noteApi } from '../../api/note-api.js';
import { refreshNoteListView } from './note-search.js';
import { getCurrentNoteId, loadNoteIntoEditor } from './note-editor.js';
import type { Note, NoteHistoryEntry } from '../../../../src/shared/types/notes.js';

/** Diff output line [diff 输出行] */
interface DiffLine {
  type: 'ctx' | 'add' | 'del';
  text: string;
}

/** LCS cell budget: beyond this fall back to plain preview (no diff) [LCS 预算：超出则退化为纯预览] */
const MAX_LCS_CELLS = 4_000_000;

/**
 * Get the modal element [获取弹窗元素]
 */
function getModal(): HTMLElement | null {
  return document.getElementById('noteHistoryModal');
}

/**
 * Line diff via LCS (custom implementation, no dependencies) [基于 LCS 的行级差异 (自研实现，无依赖)]
 */
function diffLines(oldText: string, newText: string): DiffLine[] | null {
  const a = oldText.length ? oldText.split('\n') : [];
  const b = newText.length ? newText.split('\n') : [];
  if (a.length * b.length > MAX_LCS_CELLS) return null; // Too large, caller falls back [过大，调用方退化处理]

  // LCS length table [LCS 长度表]
  const n = a.length, m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Walk the table to emit the diff [回溯表生成差异]
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'ctx', text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] });
      i++;
    } else {
      out.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: 'del', text: a[i++] });
  while (j < m) out.push({ type: 'add', text: b[j++] });
  return out;
}

/**
 * Render the diff (or plain preview fallback) into the detail panel
 * [渲染差异 (或退化纯预览) 到详情面板]
 */
function renderDetail(diffEl: HTMLElement, snapshotContent: string, currentContent: string): void {
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

/**
 * Render the snapshot list [渲染快照列表]
 */
function renderList(entries: NoteHistoryEntry[], selectedTs: string | null, onSelect: (ts: string) => void): void {
  const listEl = document.getElementById('noteHistoryList');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = t('history.empty');
    listEl.appendChild(empty);
    return;
  }

  for (const entry of entries) {
    const item = document.createElement('div');
    item.className = 'history-item' + (entry.ts === selectedTs ? ' selected' : '');
    item.innerHTML = `
      <div class="history-item-time">${formatDateTime(entry.savedAt)}</div>
      <div class="history-item-title">${escapeHtml(entry.title || t('main.noteUntitled'))}</div>
      <div class="history-item-chars">${t('history.charCount', { n: String(entry.charCount) })}</div>
    `;
    item.addEventListener('click', () => onSelect(entry.ts));
    listEl.appendChild(item);
  }
}

/**
 * Show note history modal [显示笔记历史弹窗]
 */
export async function showNoteHistory(noteId: string): Promise<void> {
  const modal = getModal();
  const detailEl = document.getElementById('noteHistoryDetail');
  const restoreBtn = document.getElementById('noteHistoryRestoreBtn');
  if (!modal || !detailEl) return;

  const result = await noteApi.history(noteId);
  if (!result.success || !result.entries) {
    console.error('加载历史记录失败:', result.error);
    showToast(t('history.loadFailed'), 'error');
    return;
  }

  const current = await storageManager.getNoteById(noteId);
  let currentContent = current ? current.content : '';
  let selectedTs: string | null = null;
  if (restoreBtn) restoreBtn.style.display = 'none';
  detailEl.innerHTML = `<div class="history-empty">${t('history.hint')}</div>`;

  const select = async (ts: string): Promise<void> => {
    selectedTs = ts;
    renderList(result.entries!, ts, id => { void select(id); });

    const snap = await noteApi.getSnapshot(noteId, ts);
    if (!snap.success || !snap.snapshot) {
      detailEl.innerHTML = `<div class="history-empty">${t('history.loadFailed')}</div>`;
      return;
    }
    // Re-read current content so the diff targets the latest saved state
    // [重新读取当前正文，保证差异对比的是最新已保存内容]
    const fresh = await storageManager.getNoteById(noteId);
    if (fresh) currentContent = fresh.content;

    const header = document.createElement('div');
    header.className = 'history-diff-title';
    header.textContent = t('history.diffTitle');
    const body = document.createElement('div');
    body.className = 'history-diff';
    renderDetail(body, snap.snapshot.note.content, currentContent);
    detailEl.innerHTML = '';
    detailEl.append(header, body);

    if (restoreBtn) {
      restoreBtn.style.display = '';
      restoreBtn.onclick = () => { void doRestore(noteId, ts); };
    }
  };

  renderList(result.entries, null, id => { void select(id); });
  modal.style.display = 'flex';
  // Auto-select the newest snapshot [自动选中最新快照]
  if (result.entries.length > 0) await select(result.entries[0].ts);
}

/**
 * Restore a snapshot and refresh the UI [恢复快照并刷新界面]
 */
async function doRestore(noteId: string, ts: string): Promise<void> {
  const result = await noteApi.restoreSnapshot(noteId, ts);
  if (!result.success || !result.note) {
    console.error('恢复历史版本失败:', result.error);
    showToast(t('history.restoreFailed'), 'error');
    return;
  }

  // Refresh the renderer-side meta cache (restore bypassed storageManager) [刷新渲染侧元数据缓存 (恢复绕过了 storageManager)]
  await storageManager.refresh();
  await refreshNoteListView();

  // Reload the editor when the restored note is open [恢复的笔记正打开时重载编辑器]
  if (getCurrentNoteId() === noteId) {
    const fresh = await storageManager.getNoteById(noteId);
    if (fresh) await loadNoteIntoEditor(fresh as Note);
  }

  showToast(t('history.restoredToast'), 'success');
  hideNoteHistory();
}

/**
 * Hide note history modal [隐藏笔记历史弹窗]
 */
export function hideNoteHistory(): void {
  const modal = getModal();
  if (modal) modal.style.display = 'none';
}

/**
 * Bind history modal close handlers (call once on init) [绑定历史弹窗关闭事件 (初始化时调用一次)]
 */
export function bindNoteHistoryModalHandlers(): void {
  const modal = getModal();
  if (modal) {
    // Overlay click closes (target = overlay itself) [点击遮罩关闭 (仅遮罩本体)]
    modal.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === modal) hideNoteHistory();
    });
  }
  const closeBtn = document.getElementById('noteHistoryCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', hideNoteHistory);
}

/**
 * Show a toast when the startup integrity scan repaired or quarantined notes
 * [启动完整性扫描修复或隔离了笔记时显示提示]
 */
export async function showNoteHistoryStartupToast(): Promise<void> {
  try {
    const result = await noteApi.integrityReport();
    if (!result.success || !result.report) return;
    const { repairedNotes, quarantinedNotes } = result.report;
    if (repairedNotes > 0) {
      showToast(t('history.recoveredToast', { n: String(repairedNotes) }), 'warning', 5000);
    } else if (quarantinedNotes.length > 0) {
      showToast(t('history.quarantinedToast', { n: String(quarantinedNotes.length) }), 'error', 6000);
    }
  } catch (err) {
    console.warn('[NoteHistory] integrity report unavailable:', err);
  }
}
