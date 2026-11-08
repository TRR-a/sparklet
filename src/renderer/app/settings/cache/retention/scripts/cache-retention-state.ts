// Cache retention state [缓存保留天数状态]

import { RETENTION_DEFAULT } from './cache-retention-constants.js';

let currentRetentionDays = RETENTION_DEFAULT;
let retentionSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get current retention days [获取当前保留天数]
 */
export function getCurrentRetentionDays(): number {
  return currentRetentionDays;
}

/** Persist current retention days [写入当前保留天数] */
export function setCurrentRetentionDays(days: number): void {
  currentRetentionDays = days;
}

/** Read pending save timer [读取待触发的保存定时器] */
export function getRetentionSaveTimer(): ReturnType<typeof setTimeout> | null {
  return retentionSaveTimer;
}

/** Persist pending save timer [写入待触发的保存定时器] */
export function setRetentionSaveTimer(timer: ReturnType<typeof setTimeout> | null): void {
  retentionSaveTimer = timer;
}
