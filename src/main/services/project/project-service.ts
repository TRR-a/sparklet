// Project service - folder dialog & entry [项目服务 - 文件夹对话框与入口]
// Tree reading in project-tree-reader.ts, file IO in project-file-io.ts
// [目录树读取在 project-tree-reader.ts，文件读写在 project-file-io.ts]

import { dialog } from 'electron';
import type { ProjectOpenResult } from 'sparklet/shared/types/project.js';

export { readDirectoryTree } from 'sparklet/main/services/project/project-tree-reader.js';
export { readFile, writeFile } from 'sparklet/main/services/project/project-file-io.js';

/**
 * Open a folder selection dialog [打开文件夹选择对话框]
 */
export async function openFolderDialog(): Promise<ProjectOpenResult> {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择项目文件夹',
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, canceled: true };
    }
    return { success: true, path: result.filePaths[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
