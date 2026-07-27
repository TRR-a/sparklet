// src/main/updater/_integrity-rules.js
// 完整性校验共享规则（纯 JS，不依赖 electron，可被打包脚本 generate-manifest.js 直接引用）
// 生成端 scripts/generate-manifest.js 和运行端 constants.js 都从这里加载黑名单 + 过滤函数，保证两端过滤规则 100% 一致

// ---------- 文件名精确匹配黑名单（完整文件名，区分大小写）----------
const INTEGRITY_FILENAME_BLACKLIST = new Set([
  'manifest.current.json',
  'manifest.releases.json'
]);

// ---------- 扩展名黑名单（统一小写比较，包含点号）----------
// 这些后缀的文件是运行时/外部可能写入安装目录的杂文件，不应该参与 filesHash 计算，避免误报损坏
const INTEGRITY_EXTENSION_BLACKLIST = new Set([
  // 日志 / 调试 / 备份
  '.log',
  '.bak',
  '.old',
  // 临时文件 / 部分下载 / 中间状态
  '.tmp',
  '.temp',
  '.part',
  '.crdownload',
  // 崩溃转储 / 崩溃报告
  '.dmp',
  '.mdmp',
  '.crash',
  // 系统 / 工具自动生成的垃圾文件
  '.thumbs.db',
  '.ds_store'
]);

/**
 * 判断某个文件名是否应该跳过完整性校验
 * @param {string} filename  不含路径的纯文件名（basename）
 * @returns {boolean} true = 跳过不参与 filesHash 计算
 */
function isExcludedFromIntegrity(filename) {
  if (!filename) return true;
  // 1) 精确文件名匹配
  if (INTEGRITY_FILENAME_BLACKLIST.has(filename)) return true;
  // 2) 扩展名匹配（统一小写，避免 .DMP vs .dmp 漏过滤）
  const lower = filename.toLowerCase();
  for (const ext of INTEGRITY_EXTENSION_BLACKLIST) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

module.exports = {
  INTEGRITY_FILENAME_BLACKLIST,
  INTEGRITY_EXTENSION_BLACKLIST,
  isExcludedFromIntegrity
};
