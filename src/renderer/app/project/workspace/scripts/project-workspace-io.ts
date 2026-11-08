// Project workspace operations - barrel [项目工作区操作 - 汇总出口]
// Restore, add, remove, toggle [恢复、添加、移除、折叠]
//
// Split out [已拆分]：restore → workspace-restore.ts, add → workspace-open-folder.ts,
// remove → workspace-remove.ts, toggle → workspace-toggle.ts.

export { restoreWorkspace } from 'sparklet/renderer/app/project/workspace/scripts/workspace-restore.js';
export { openProjectFolder } from 'sparklet/renderer/app/project/workspace/scripts/workspace-open-folder.js';
export { removeProjectFromWorkspace } from 'sparklet/renderer/app/project/workspace/scripts/workspace-remove.js';
export { toggleProject } from 'sparklet/renderer/app/project/workspace/scripts/workspace-toggle.js';
