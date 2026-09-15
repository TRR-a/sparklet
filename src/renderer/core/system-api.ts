// System monitor renderer-side API [系统监控渲染侧 API]

import { bus } from './ipc-bus.js';
import type { SystemStats } from '../../shared/types/system.js';

export const systemApi = {
  /** Fetch one CPU/memory/disk/GPU snapshot [获取一份 CPU/内存/磁盘/GPU 快照] */
  stats(): Promise<SystemStats> {
    return bus.invoke<SystemStats>('system:stats');
  },

  /** Open the logs folder in the system file manager [在系统文件管理器中打开日志文件夹] */
  openLogsFolder(): Promise<{ success: boolean; root?: string; error?: string }> {
    return bus.invoke('logs:open-folder');
  },

  /** Tail recent kernel.log lines [读取 kernel.log 尾部内容] */
  tailLogs(maxLines = 200): Promise<{ success: boolean; lines?: string[]; file?: string; error?: string }> {
    return bus.invoke('logs:tail', maxLines);
  },
};
