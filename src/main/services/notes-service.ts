// Notes file system storage service [笔记文件系统存储服务]
// Each note is stored independently as .json (metadata) + .md (content) [每个笔记独立存储为 .json (元数据) + .md (正文)]

import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';
import type { Note, NoteMeta, NoteListResult, NoteGetResult, NoteSaveResult, NoteOperationResult } from '../../shared/types/notes';

/** Old note format from electron-store (before migration) [旧 electron-store 中的笔记格式 (迁移前)] */
interface OldNote {
  id?: string;
  title?: string;
  content?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

/** Partial note metadata (without content) [部分笔记元数据 (不含正文)] */
type NoteMetaPartial = Partial<NoteMeta>;

/**
 * Get notes directory path [获取笔记目录路径]
 */
export function getNotesDir(): string {
  return path.join(app.getPath('userData'), 'notes');
}

/**
 * Ensure notes directory exists [确保笔记目录存在]
 */
export async function ensureNotesDir(): Promise<string> {
  const dir = getNotesDir();
  await fs.ensureDir(dir);
  return dir;
}

/**
 * List all notes (without content) [列出所有笔记 (不含 content)]
 */
export async function listNotes(): Promise<NoteListResult> {
  try {
    const notesDir = await ensureNotesDir();
    const files = await fs.readdir(notesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const notes: NoteMetaPartial[] = [];
    for (const file of jsonFiles) {
      const id = file.replace('.json', '');
      const jsonPath = path.join(notesDir, file);
      try {
        const meta = await fs.readJson(jsonPath) as NoteMetaPartial;
        if (!meta.id) meta.id = id;
        notes.push(meta);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[NotesFS] Skip invalid json: ${file}`, msg);
      }
    }

    notes.sort((a, b) => {
      const aTime = new Date(a.updatedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
    return { success: true, notes: notes as NoteMeta[] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] list error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get a single note (with content) [获取单篇笔记 (含 content)]
 */
export async function getNote(id: string): Promise<NoteGetResult> {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);
    const mdPath = path.join(notesDir, `${id}.md`);

    const meta = await fs.readJson(jsonPath) as NoteMeta;
    let content = '';
    try {
      content = await fs.readFile(mdPath, 'utf8');
    } catch {
      console.warn(`[NotesFS] .md missing for ${id}, treating as empty.`);
    }

    return { success: true, note: { ...meta, content } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] get error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Write file with retry on EPERM (Windows anti-virus/indexing may briefly lock files) [写入文件并在 EPERM 时重试 (Windows 杀毒软件/索引服务可能短暂锁文件)]
 */
async function writeFileWithRetry(filePath: string, data: string, maxRetries: number = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.writeFile(filePath, data, 'utf8');
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'EPERM' || code === 'EACCES') {
        if (attempt < maxRetries) {
          console.warn(`[NotesFS] writeFile EPERM attempt ${attempt}/${maxRetries}, retrying in 300ms...`);
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        }
      }
      throw err;
    }
  }
}

/**
 * Save a note (create or update) [保存笔记 (新建或更新)]
 */
export async function saveNote(noteData: Note): Promise<NoteSaveResult> {
  try {
    if (!noteData || !noteData.id) throw new Error('Invalid note data');
    const notesDir = await ensureNotesDir();
    const { content, ...meta } = noteData;

    const jsonPath = path.join(notesDir, `${noteData.id}.json`);
    await writeFileWithRetry(jsonPath, JSON.stringify(meta, null, 2));

    const mdPath = path.join(notesDir, `${noteData.id}.md`);
    await writeFileWithRetry(mdPath, content || '');

    return { success: true, note: noteData };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] save error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Soft delete (move to trash) [软删除 (移入回收站)]
 */
export async function deleteNote(id: string): Promise<NoteOperationResult> {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);

    const meta = await fs.readJson(jsonPath) as NoteMeta;
    meta.isDeleted = true;
    meta.deletedAt = new Date().toISOString();
    await writeFileWithRetry(jsonPath, JSON.stringify(meta, null, 2));

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] delete error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Restore soft-deleted note [恢复软删除]
 */
export async function restoreNote(id: string): Promise<NoteOperationResult> {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);

    const meta = await fs.readJson(jsonPath) as NoteMeta;
    meta.isDeleted = false;
    meta.deletedAt = null;
    await writeFileWithRetry(jsonPath, JSON.stringify(meta, null, 2));

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] restore error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Permanently delete (physically remove .json + .md) [永久删除 (物理删除 .json + .md)]
 */
export async function permanentDeleteNote(id: string): Promise<NoteOperationResult> {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);
    const mdPath = path.join(notesDir, `${id}.md`);

    if (await fs.pathExists(jsonPath)) await fs.remove(jsonPath);
    if (await fs.pathExists(mdPath)) await fs.remove(mdPath);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[NotesFS] permanentDelete error:', msg);
    return { success: false, error: msg };
  }
}

export type { OldNote };
