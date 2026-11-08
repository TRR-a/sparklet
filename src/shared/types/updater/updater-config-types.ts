// Updater config types [更新配置类型]

/** Updater configuration [更新配置] */
export interface UpdaterConfig {
  updateBehavior: 'auto' | 'notify-only' | 'disabled';
  checkInterval: number;
  lastCheckTime: string | null;
  autoDownload: boolean;
  integrityCheck: boolean;
  cacheRetentionDays: number;
}
