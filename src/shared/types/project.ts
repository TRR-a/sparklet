// Project module types [项目模块类型]

/** File system tree node [文件系统树节点] */
export interface ProjectFileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: ProjectFileNode[];
  size?: number;
}

/** Result of reading a directory tree [读取目录树结果] */
export interface ProjectTreeResult {
  success: boolean;
  root?: ProjectFileNode;
  error?: string;
}

/** Result of opening a folder dialog [打开文件夹对话框结果] */
export interface ProjectOpenResult {
  success: boolean;
  path?: string;
  canceled?: boolean;
  error?: string;
}

/** Result of reading a file for preview [读取文件用于预览的结果] */
export interface ProjectFileReadResult {
  success: boolean;
  content?: string;
  isImage?: boolean;
  isBinary?: boolean;
  tooLarge?: boolean;
  size?: number;
  error?: string;
}

/** Project API exposed to renderer [暴露给渲染进程的项目 API] */
export interface ProjectAPI {
  openFolder: () => Promise<ProjectOpenResult>;
  readTree: (dirPath: string) => Promise<ProjectTreeResult>;
  readFile: (filePath: string) => Promise<ProjectFileReadResult>;
}
