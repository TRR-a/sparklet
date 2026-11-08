// Installed files verify: gate checks [已安装文件校验 - 前置门禁]

import { app } from 'electron';
import { getConfigItem } from '../config/config-manager.js';

/**
 * Decide whether the installed-files check should be skipped [判断是否跳过已安装文件校验]
 * Skips in dev environment and when the user disabled integrityCheck [开发环境跳过；用户关闭 integrityCheck 时跳过]
 * @returns true when the check must be skipped [需要跳过时返回 true]
 */
export async function shouldSkipInstalledFilesCheck(): Promise<boolean> {
  // Skip check in development environment [开发环境跳过校验]
  if (!app.isPackaged) {
    console.log('[Verify] Development environment, skipping installed files check');
    return true;
  }

  // Read config, check if integrity check is enabled [读取配置，检查是否启用完整性校验]
  try {
    const enabled = await getConfigItem('integrityCheck');
    if (enabled === false) {
      console.log('[Verify] Integrity check disabled by user');
      return true;
    }
  } catch (err) {
    console.log('[Verify] Config read failed, using default (enabled)');
  }
  return false;
}
