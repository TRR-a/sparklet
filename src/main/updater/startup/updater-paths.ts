// Updater path resolvers [更新器路径解析]

import * as path from 'path';
import { app } from 'electron';
import { UPDATE_CACHE_DIRNAME } from 'sparklet/main/updater/constants/constants.js';

// Get app code root directory (after packaging points to resources/app.asar or resources/app) [获取应用代码根目录 (打包后指向 resources/app.asar 或 resources/app)]
// Note: do NOT use this directory for filesHash integrity check, because the packaging side computes hash over the entire win-unpacked root [注意：完整性校验 filesHash 不要用这个目录，因为打包端算的是整个 win-unpacked 根]
export function getAppRoot(): string {
  return app.getAppPath();
}

// Get install root directory (= Sparklet.exe directory, corresponds to win-unpacked/ root at packaging time) [获取安装根目录 (= Sparklet.exe 所在目录，对应打包时的 win-unpacked/ 根)]
// Both filesHash generation and verification should use this as scan root to ensure consistent scope [filesHash 生成端和校验端都应该用这个作为扫描根，保证范围一致]
export function getInstallRoot(): string {
  return path.dirname(process.execPath);
}

// Get user data directory [获取用户数据目录]
export function getUserDataPath(): string {
  return app.getPath('userData');
}

// Get temp directory path [获取临时目录路径]
export function getTempPath(): string {
  return app.getPath('temp');
}

// Get external updater script path [获取外部更新器路径]
export function getUpdaterScriptPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'updater.js');
  } else {
    return path.join(app.getAppPath(), '../resources/updater.js');
  }
}

// Get update package cache directory (persistent, under userData) [获取更新包缓存目录 (持久化，位于 userData 下)]
export function getUpdateCacheDir(): string {
  return path.join(getUserDataPath(), UPDATE_CACHE_DIRNAME);
}

// Get update package cache metadata file path (cache.json) [获取更新包缓存的元数据文件路径 (cache.json)]
export function getUpdateCacheMetaPath(): string {
  return path.join(getUpdateCacheDir(), 'cache.json');
}
