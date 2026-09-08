// System monitor renderer-side API [系统监控渲染侧 API]

import { bus } from './ipc-bus.js';
import type { SystemStats } from '../../shared/types/system.js';

export const systemApi = {
  /** Fetch one CPU/memory/disk/GPU snapshot [获取一份 CPU/内存/磁盘/GPU 快照] */
  stats(): Promise<SystemStats> {
    return bus.invoke<SystemStats>('system:stats');
  },
};
