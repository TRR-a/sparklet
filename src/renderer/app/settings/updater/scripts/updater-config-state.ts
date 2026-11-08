// Settings: updater config section state [设置 - 更新配置区状态]

import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';

/** Whether running in dev environment [是否开发环境] */
let isDevEnvironment = false;

/** Current updater config cache [当前更新配置缓存] */
let updaterConfig: UpdaterConfig | null = null;

/** Expose dev environment flag [暴露开发环境标志] */
export function getIsDevEnvironment(): boolean {
  return isDevEnvironment;
}

/** Persist dev environment flag [写入开发环境标志] */
export function setIsDevEnvironment(value: boolean): void {
  isDevEnvironment = value;
}

/** Expose current updater config [暴露当前更新配置] */
export function getUpdaterConfig(): UpdaterConfig | null {
  return updaterConfig;
}

/** Persist current updater config cache [写入当前更新配置缓存] */
export function setUpdaterConfig(value: UpdaterConfig | null): void {
  updaterConfig = value;
}
