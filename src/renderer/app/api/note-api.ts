// Note module renderer-side API [note 模块渲染侧 API]
// Talks to the main process through the core IPC bus instead of a hard-coded preload bridge [经核心 IPC 总线与主进程通信，而非写死的 preload 桥]
//
// Split out [已拆分]：CRUD → note-api-crud.ts, search → note-api-search.ts,
// history → note-api-history.ts, integrity → note-api-integrity.ts.

import { noteCrudApi } from './note-api-crud.js';
import { noteSearchApi } from './note-api-search.js';
import { noteHistoryApi } from './note-api-history.js';
import { noteIntegrityApi } from './note-api-integrity.js';

export const noteApi = {
  ...noteCrudApi,
  ...noteSearchApi,
  ...noteHistoryApi,
  ...noteIntegrityApi,
};
