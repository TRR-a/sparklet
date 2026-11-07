// Storage manager - Sparklet file system storage manager [存储管理器 - Sparklet 文件系统存储管理器]
// Each note is stored independently as .json (metadata) + .md (content) [每个笔记独立存储为 .json (元数据) + .md (正文)]
//
// Internals split out [内部已拆分]：cache/FS load → storage-cache.ts,
// read queries → storage-query.ts, CRUD → storage-crud.ts,
// batch → storage-batch.ts, refresh/debug → storage-maintenance.ts
// Facade groups [外观分组]：queries → storage-manager-queries.ts,
// mutations → storage-manager-mutations.ts, maintenance → storage-manager-maintenance.ts

import { storageManagerQueries } from './storage-manager-queries.js';
import { storageManagerMutations } from './storage-manager-mutations.js';
import { storageManagerMaintenance } from './storage-manager-maintenance.js';

const storageManager = {
  ...storageManagerQueries,
  ...storageManagerMutations,
  ...storageManagerMaintenance,
};

export default storageManager;
