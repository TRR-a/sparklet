// Config watcher: external change handling [配置监听 - 外部变更处理]

import { readConfig, invalidateConfigCache, consumeSelfWrite } from './config-store.js';
import { broadcastConfigChange } from './config-broadcast.js';

let configChangeTimer: NodeJS.Timeout | null = null;

/**
 * Handle one watch event: skip self-writes, otherwise reload + broadcast debounced
 * [处理一次监听事件：跳过自写，否则防抖后重载并广播]
 */
export function handleExternalConfigChange(eventType: string): void {
  // Both 'change' and 'rename' trigger (some Windows editors save via temp file → rename, triggering rename) [change 和 rename 都触发 (Windows 下部分编辑器保存用「写临时文件→重命名替换」，触发 rename)]
  if (eventType !== 'change' && eventType !== 'rename') return;

  // Skip changes triggered by self-write (writeConfig already broadcasts directly) [自己写入触发的变化，跳过 (writeConfig 已直接广播)]
  if (consumeSelfWrite()) {
    if (configChangeTimer) clearTimeout(configChangeTimer);
    configChangeTimer = null;
    return;
  }
  console.log('[ConfigManager] Config file changed externally, reloading...');
  // Real debounce: clear previous timer to avoid multiple broadcasts in short time [真正的防抖：清除上一个 timer，避免短时间内多次广播]
  if (configChangeTimer) clearTimeout(configChangeTimer);
  configChangeTimer = setTimeout(async () => {
    invalidateConfigCache(); // Invalidate cache so readConfig reloads from disk [失效缓存，让 readConfig 从磁盘重新读取]
    const config = await readConfig();
    broadcastConfigChange(config);
    configChangeTimer = null;
  }, 500);
}
