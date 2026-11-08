// Exit dialog: save-before-quit [退出弹窗 - 退出前保存]

import { saveCurrentNote } from '../../../editor/scripts/note-editor.js';
import { saveCurrentFile } from 'sparklet/renderer/app/project/scripts/project-view.js';

/**
 * Save all unsaved content before quitting [退出前保存所有未保存内容]
 * Best-effort: a single save failure is logged but does not block quit [尽力而为：单项保存失败仅记录日志，不阻塞退出]
 */
export async function saveAllBeforeQuit(): Promise<void> {
  try {
    await saveCurrentNote();
  } catch (err) {
    console.warn('[ExitDialog] Failed to save note before quit:', err);
  }
  try {
    await saveCurrentFile();
  } catch (err) {
    console.warn('[ExitDialog] Failed to save project file before quit:', err);
  }
}
