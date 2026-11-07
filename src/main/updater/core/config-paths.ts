// Config directory / file path resolution - barrel [配置目录与文件路径解析 - 汇总出口]
//
// Split out [已拆分]：directory resolve + cache → config-dir.ts,
// file path → config-file-path.ts.

export { getConfigDir } from './config-dir.js';
export type { ConfigDirResult } from './config-dir.js';
export { getConfigFilePath } from './config-file-path.js';
