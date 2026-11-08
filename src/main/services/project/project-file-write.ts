// Project file: write text [项目文件 - 写入文本]

import * as fs from 'fs-extra';
import type { ProjectFileWriteResult } from 'sparklet/shared/types/project.js';

/**
 * Write text content to a file [写入文本内容到文件]
 */
export async function writeFile(filePath: string, content: string): Promise<ProjectFileWriteResult> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
