// Project module renderer-side API [project 模块渲染侧 API]
// Talks to the main process through the core IPC bus [经核心 IPC 总线与主进程通信]

import { bus } from '../../../core/ipc-bus.js';
import type {
  ProjectOpenResult,
  ProjectTreeResult,
  ProjectFileReadResult,
  ProjectFileWriteResult,
} from '../../../../shared/types/project.js';

export const projectApi = {
  openFolder(): Promise<ProjectOpenResult> {
    return bus.invoke<ProjectOpenResult>('project:open-folder');
  },
  readTree(dirPath: string): Promise<ProjectTreeResult> {
    return bus.invoke<ProjectTreeResult>('project:read-tree', dirPath);
  },
  readFile(filePath: string): Promise<ProjectFileReadResult> {
    return bus.invoke<ProjectFileReadResult>('project:read-file', filePath);
  },
  writeFile(filePath: string, content: string): Promise<ProjectFileWriteResult> {
    return bus.invoke<ProjectFileWriteResult>('project:write-file', filePath, content);
  },
};
