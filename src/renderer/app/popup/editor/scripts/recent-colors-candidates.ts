// Recent colors: candidate swatches on the palette [最近颜色 - 色板候选色块]

import { changeNoteColor } from '../../note/scripts/note-operations.js';
import { loadRecentColors } from './recent-colors-store.js';

/** Candidate swatches shown between fixed colors and the wheel button [固定色与调色盘按钮之间显示的候选数] */
const CANDIDATE_COUNT = 3;

/**
 * Render candidate swatches between fixed colors and the wheel button
 * (first CANDIDATE_COUNT of the recent list, hidden when no records)
 * [渲染固定色与调色盘按钮之间的候选色块（最近列表前 CANDIDATE_COUNT 个，无记录时隐藏不占位）]
 */
export async function renderCandidates(): Promise<void> {
  const wrap = document.getElementById('customColorCandidates');
  if (!wrap) return;
  const list = (await loadRecentColors()).slice(0, CANDIDATE_COUNT);
  wrap.innerHTML = '';
  if (list.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'flex';
  for (const hex of list) {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-candidate';
    swatch.style.backgroundColor = hex;
    swatch.title = hex;
    swatch.setAttribute('aria-label', hex);
    swatch.addEventListener('click', () => { void changeNoteColor(hex); });
    wrap.appendChild(swatch);
  }
}
