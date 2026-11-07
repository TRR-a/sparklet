// Updater API: update cache [更新 API - 更新缓存]

import { bus } from '../ipc/ipc-bus.js';
import type { CacheInfo } from 'sparklet/shared/types/updater.js';

export const updaterApiCache = {
  // ---------- Update cache [更新缓存] ----------
  getCacheInfo(): Promise<{ success: boolean; info?: CacheInfo; error?: string }> {
    return bus.invoke('update-cache:get-info');
  },
  clearCache(): Promise<{ success: boolean; error?: string }> {
    return bus.invoke('update-cache:clear-all');
  },
  getCacheRetentionDays(): Promise<{ success: boolean; days?: number; error?: string }> {
    return bus.invoke('update-cache:get-retention-days');
  },
  setCacheRetentionDays(days: number): Promise<{ success: boolean; days?: number; error?: string }> {
    return bus.invoke('update-cache:set-retention-days', days);
  },
};
