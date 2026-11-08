// Rollback: shared types [回滚 - 共享类型]

/** Pending update info [待安装更新信息] */
export interface PendingUpdateInfo {
  zipPath: string;
  tempDir: string;
  isManualDir: boolean;
  targetVersion: string;
}

/** Rollback context for accessing updater state [回滚上下文，用于访问更新器状态] */
export interface RollbackContext {
  setPendingUpdate: (update: PendingUpdateInfo | null) => void;
}
