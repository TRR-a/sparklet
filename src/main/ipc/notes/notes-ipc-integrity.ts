// Notes IPC: integrity report channel [笔记 IPC - 完整性报告通道]

import { ipcMain } from 'electron';
import { getIntegrityReport } from 'sparklet/main/services/note/io/note-integrity.js';

/** Register the startup integrity report handler [注册启动完整性报告处理器] */
export function registerNotesIntegrityIpc(): void {
  // 11. Startup integrity scan report (for renderer toast) [启动完整性扫描报告 (供渲染层提示)]
  ipcMain.handle('notes:integrity:report', async () => {
    return getIntegrityReport();
  });
}
