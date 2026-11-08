// Project file: read (text or image) [项目文件 - 读取 (文本或图片)]

import * as fs from 'fs-extra';
import type { ProjectFileReadResult } from 'sparklet/shared/types/project.js';
import { IMAGE_EXTS, BINARY_EXTS } from 'sparklet/main/services/project/project-file-exts.js';

/**
 * Read a file (text or image) [读取文件 (文本或图片)]
 */
export async function readFile(filePath: string): Promise<ProjectFileReadResult> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return { success: false, error: 'Not a file' };
    }

    const ext = filePath.split('.').pop()?.toLowerCase() || '';

    // Binary files (not images) → don't read content [二进制文件 (非图片) → 不读内容]
    if (BINARY_EXTS.has(ext) && !IMAGE_EXTS.has(ext)) {
      return { success: true, isBinary: true, size: stat.size };
    }

    if (IMAGE_EXTS.has(ext)) {
      // For SVG, read as text; for other images, we'll use file:// URL in renderer
      if (ext === 'svg') {
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content, isImage: true, size: stat.size };
      }
      // Non-SVG images: renderer will load via file:// path, no content needed
      return { success: true, isImage: true, size: stat.size };
    }

    const content = await fs.readFile(filePath, 'utf-8');
    // Fallback: detect binary by null bytes [兜底：通过 null 字节检测二进制]
    if (content.includes('\0')) {
      return { success: true, isBinary: true, size: stat.size };
    }
    return { success: true, content, size: stat.size };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
