// Recent colors: storage [最近颜色 - 存储]

import { storeApi } from 'sparklet/renderer/shared/index.js';

/** Store key for recent custom colors (persisted config file) [最近自定义颜色的存储键 (持久化配置文件)] */
const RECENT_KEY = 'recentColors';
/** Max recorded colors: 3 candidates on the palette + 10 in the wheel (2x5) [记录上限：色板 3 个候选 + 色环内 10 个 (2x5)] */
const RECENT_MAX = 10;

/**
 * Load recent colors from the store config file [从配置文件读取最近颜色]
 */
export async function loadRecentColors(): Promise<string[]> {
  try {
    const arr = await storeApi.get<unknown>(RECENT_KEY);
    return Array.isArray(arr) ? arr.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Push a color into recent list (dedup, newest first, cap at RECENT_MAX)
 * [把颜色压入最近列表（去重、新的在前、上限 RECENT_MAX 个）]
 */
export async function pushRecentColor(hex: string): Promise<void> {
  const list = (await loadRecentColors()).filter((c) => c !== hex);
  list.unshift(hex);
  await storeApi.set(RECENT_KEY, list.slice(0, RECENT_MAX));
}
