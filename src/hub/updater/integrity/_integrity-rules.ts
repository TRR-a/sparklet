// Shared integrity rules (pure JS, no electron dependency, can be imported by both build scripts and runtime) [完整性校验共享规则 (纯 JS，不依赖 electron，可被打包脚本 generate-manifest.js 直接引用)]
// Both scripts/generate-manifest.js and runtime constants.ts load blacklist + filter from here [生成端 scripts/generate-manifest.js 和运行端 constants.ts 都从这里加载黑名单 + 过滤函数，保证两端过滤规则 100% 一致]

// ---------- Exact filename blacklist (case-sensitive, full filename) ---------- [精确文件名黑名单 (完整文件名，区分大小写)]
export const INTEGRITY_FILENAME_BLACKLIST: ReadonlySet<string> = new Set([
  'manifest.current.json',
  'manifest.releases.json'
]);

// ---------- Extension blacklist (lowercase comparison, includes dot) ---------- [扩展名黑名单 (统一小写比较，包含点号)]
// Files with these extensions are runtime/external junk that may be written to install dir, they should NOT participate in filesHash computation to avoid false-positive corruption reports [这些后缀的文件是运行时/外部可能写入安装目录的杂文件，不应该参与 filesHash 计算，避免误报损坏]
export const INTEGRITY_EXTENSION_BLACKLIST: ReadonlySet<string> = new Set([
  // Logs / debug / backup [日志 / 调试 / 备份]
  '.log',
  '.bak',
  '.old',
  // Temporary / partial download / intermediate state [临时文件 / 部分下载 / 中间状态]
  '.tmp',
  '.temp',
  '.part',
  '.crdownload',
  // Crash dumps / crash reports [崩溃转储 / 崩溃报告]
  '.dmp',
  '.mdmp',
  '.crash',
  // System / tool auto-generated junk files [系统 / 工具自动生成的垃圾文件]
  '.thumbs.db',
  '.ds_store'
]);

/**
 * Check whether a filename should be excluded from integrity verification [判断某个文件名是否应该跳过完整性校验]
 * @param filename Basename without path [不含路径的纯文件名]
 * @returns true = skip, do not participate in filesHash [true = 跳过不参与 filesHash 计算]
 */
export function isExcludedFromIntegrity(filename: string): boolean {
  if (!filename) return true;
  // 1) Exact filename match [精确文件名匹配]
  if (INTEGRITY_FILENAME_BLACKLIST.has(filename)) return true;
  // 2) Extension match (lowercase to avoid .DMP vs .dmp leakage) [扩展名匹配 (统一小写，避免 .DMP vs .dmp 漏过滤)]
  const lower = filename.toLowerCase();
  for (const ext of INTEGRITY_EXTENSION_BLACKLIST) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}
