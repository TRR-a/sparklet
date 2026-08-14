// Migration service: migrate notes from electron-store to file system [迁移服务：将笔记从 electron-store 迁移到文件系统]

import * as fs from 'fs-extra';
import * as path from 'path';
import { store } from './store';
import { ensureNotesDir } from './notes-service';
import type { OldNote } from './notes-service';

/**
 * Migrate notes from electron-store to file system [将笔记从 electron-store 迁移到文件系统]
 * Each note is split into .json (metadata) + .md (content) [每个笔记分离为 .json (元数据) + .md (正文)]
 */
export async function migrateFromStore(): Promise<void> {
  try {
    const migrated = store.get('fs_migration_done', false) as boolean;
    if (migrated) {
      console.log('[NotesFS] Migration already done, skipping.');
      return;
    }

    const oldNotes = store.get('sparkletNotes', []) as OldNote[];
    console.log('[NotesFS] Found', oldNotes.length, 'notes in old store');

    if (!oldNotes || oldNotes.length === 0) {
      store.set('fs_migration_done', true);
      console.log('[NotesFS] No old notes to migrate, marked done.');
      return;
    }

    const notesDir = await ensureNotesDir();
    console.log('[NotesFS] Notes directory:', notesDir);

    let migratedCount = 0;
    let errorCount = 0;

    for (const note of oldNotes) {
      if (!note || !note.id) {
        console.warn('[NotesFS] Skipping invalid note (missing id):', note);
        continue;
      }

      const jsonPath = path.join(notesDir, `${note.id}.json`);
      const mdPath = path.join(notesDir, `${note.id}.md`);

      // If files already exist, skip (protect existing files) [如果文件已存在则跳过 (保护已有文件)]
      if (await fs.pathExists(jsonPath) && await fs.pathExists(mdPath)) {
        console.log(`[NotesFS] Skipping existing note: ${note.id}`);
        continue;
      }

      try {
        // Separate content and metadata [分离内容和元数据]
        const { content, ...meta } = note;
        // Ensure meta has id [确保 meta 中有 id]
        meta.id = note.id;

        // Write metadata [写入元数据]
        await fs.writeJson(jsonPath, meta, { spaces: 2 });
        // Write content (if content is null/undefined, write empty string) [写入正文 (如果 content 为 null/undefined，写入空字符串)]
        await fs.writeFile(mdPath, content || '', 'utf8');

        migratedCount++;
        console.log(`[NotesFS] ✅ Migrated note: ${note.id} (title: "${meta.title || '无标题'}")`);
      } catch (err) {
        errorCount++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[NotesFS] ❌ Failed to migrate note ${note.id}:`, msg);
        // Try to delete potentially incomplete files [尝试删除可能已创建的不完整文件]
        try { await fs.remove(jsonPath); } catch { /* ignore [忽略] */ }
        try { await fs.remove(mdPath); } catch { /* ignore [忽略] */ }
      }
    }

    console.log(`[NotesFS] Migration summary: ${migratedCount} succeeded, ${errorCount} failed`);

    if (errorCount === 0) {
      // Only mark done if all succeeded [只有全部成功才标记完成]
      store.set('fs_migration_done', true);
      console.log('[NotesFS] Migration complete, marked done.');
    } else {
      // Don't mark done if there are failures, will retry on next startup [有失败的不标记完成，下次启动会重试]
      store.set('fs_migration_done', false);
      console.warn('[NotesFS] Migration had errors, will retry on next startup.');
    }
  } catch (err) {
    console.error('[NotesFS] Migration fatal error:', err);
    store.set('fs_migration_done', false);
  }
}
