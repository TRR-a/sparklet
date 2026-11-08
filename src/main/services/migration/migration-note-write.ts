// Migration: write one note to the file system [迁移 - 单条笔记落盘]

import * as fs from 'fs-extra';
import * as path from 'path';
import type { OldNote } from '../note/io/notes-service.js';

/**
 * Write one legacy note as .json (metadata) + .md (content) [将一条旧笔记写为 .json (元数据) + .md (正文)]
 * @returns true when written, false when skipped or failed [写入成功为 true，跳过或失败为 false]
 */
export async function migrateOneNote(notesDir: string, note: OldNote): Promise<boolean> {
  if (!note || !note.id) {
    console.warn('[NotesFS] Skipping invalid note (missing id):', note);
    return false;
  }

  const jsonPath = path.join(notesDir, `${note.id}.json`);
  const mdPath = path.join(notesDir, `${note.id}.md`);

  // If files already exist, skip (protect existing files) [如果文件已存在则跳过 (保护已有文件)]
  if (await fs.pathExists(jsonPath) && await fs.pathExists(mdPath)) {
    console.log(`[NotesFS] Skipping existing note: ${note.id}`);
    return false;
  }

  try {
    // Separate content and metadata [分离内容和元数据]
    const { content, ...meta } = note;
    // Ensure meta has id [确保 meta 中有 id]
    meta.id = note.id;

    // Write metadata [写入元数据]
    await fs.writeFile(jsonPath, JSON.stringify(meta, null, 2), 'utf8');
    // Write content (if content is null/undefined, write empty string) [写入正文 (如果 content 为 null/undefined，写入空字符串)]
    await fs.writeFile(mdPath, content || '', 'utf8');

    console.log(`[NotesFS] ✅ Migrated note: ${note.id} (title: "${meta.title || '无标题'}")`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[NotesFS] ❌ Failed to migrate note ${note.id}:`, msg);
    // Try to delete potentially incomplete files [尝试删除可能已创建的不完整文件]
    try { await fs.remove(jsonPath); } catch { /* ignore [忽略] */ }
    try { await fs.remove(mdPath); } catch { /* ignore [忽略] */ }
    throw err;
  }
}
