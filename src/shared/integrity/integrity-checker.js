// src/shared/integrity/integrity-checker.js
// 职责：仅负责本地哈希与远端清单的比对、异常结果精准分类
// 约束：不做任何文件操作，只做纯数据比对，输出标准化结果

/**
 * 校验结果状态枚举
 */
const CheckStatus = {
  PASSED: 'passed',           // 校验通过
  FAILED: 'failed',           // 校验失败（文件损坏/篡改）
  WARNING: 'warning',         // 警告（非核心问题，不影响使用）
  ERROR: 'error',             // 错误（清单异常/网络失败等）
  SKIPPED: 'skipped'          // 跳过（未执行校验）
};

/**
 * 异常类型枚举
 */
const IssueType = {
  FILE_MISSING: 'file_missing',       // 文件缺失
  HASH_MISMATCH: 'hash_mismatch',     // 哈希不匹配（文件损坏/篡改）
  PERMISSION_DENIED: 'permission_denied', // 权限不足
  MANIFEST_INVALID: 'manifest_invalid',   // 清单无效
  MANIFEST_MISSING: 'manifest_missing'    // 清单缺失
};

/**
 * 标准化校验结果结构
 * @typedef {Object} CheckResult
 * @property {string} status - 校验状态（CheckStatus）
 * @property {string} checkedAt - 校验时间（ISO 8601）
 * @property {string} version - 校验对应的应用版本号
 * @property {number} totalFiles - 总文件数
 * @property {number} passedFiles - 通过校验的文件数
 * @property {Object[]} issues - 发现的问题列表
 * @property {string} summary - 校验结果摘要
 */

/**
 * 创建空的校验结果
 * @param {string} version - 应用版本号
 * @returns {CheckResult} 空校验结果
 */
function createEmptyResult(version = 'unknown') {
  return {
    status: CheckStatus.SKIPPED,
    checkedAt: new Date().toISOString(),
    version: version,
    totalFiles: 0,
    passedFiles: 0,
    issues: [],
    summary: 'Integrity check not executed'
  };
}

/**
 * 比对本地哈希与远端清单
 * @param {Map<string, string>} localHashMap - 本地文件哈希映射（相对路径 -> SHA256）
 * @param {Object} manifest - 远端哈希清单
 * @returns {CheckResult} 标准化校验结果
 */
function compareHashes(localHashMap, manifest) {
  // 基础校验：清单是否有效
  if (!manifest) {
    return {
      ...createEmptyResult(),
      status: CheckStatus.ERROR,
      issues: [{
        type: IssueType.MANIFEST_MISSING,
        message: 'Hash manifest is missing or invalid'
      }],
      summary: 'Integrity check failed: missing or invalid manifest'
    };
  }

  if (!manifest.files || typeof manifest.files !== 'object') {
    return {
      ...createEmptyResult(manifest.version),
      status: CheckStatus.ERROR,
      issues: [{
        type: IssueType.MANIFEST_INVALID,
        message: 'Manifest has invalid files structure'
      }],
      summary: 'Integrity check failed: invalid manifest structure'
    };
  }

  const result = createEmptyResult(manifest.version);
  const manifestFiles = manifest.files;
  const manifestFilePaths = Object.keys(manifestFiles);
  
  result.totalFiles = manifestFilePaths.length;

  // 1. 检查清单中的每个文件是否在本地存在且哈希匹配
  for (const relativePath of manifestFilePaths) {
    const expectedHash = manifestFiles[relativePath];
    const localHash = localHashMap.get(relativePath);

    if (!localHash) {
      // 文件缺失
      result.issues.push({
        type: IssueType.FILE_MISSING,
        path: relativePath,
        message: `File missing: ${relativePath}`
      });
    } else if (localHash !== expectedHash) {
      // 哈希不匹配
      result.issues.push({
        type: IssueType.HASH_MISMATCH,
        path: relativePath,
        expectedHash: expectedHash,
        actualHash: localHash,
        message: `Hash mismatch for ${relativePath}`
      });
    } else {
      // 校验通过
      result.passedFiles++;
    }
  }

  // 2. 判定最终状态
  if (result.issues.length === 0) {
    // 无任何问题，完全通过
    result.status = CheckStatus.PASSED;
    result.summary = `Integrity check passed: all ${result.totalFiles} files are intact`;
  } else {
    // 有问题，区分严重程度
    const hasCriticalIssues = result.issues.some(issue => 
      issue.type === IssueType.FILE_MISSING || 
      issue.type === IssueType.HASH_MISMATCH
    );

    if (hasCriticalIssues) {
      result.status = CheckStatus.FAILED;
      result.summary = `Integrity check failed: ${result.issues.length} issue(s) found, including corrupted or missing files`;
    } else {
      result.status = CheckStatus.WARNING;
      result.summary = `Integrity check passed with warnings: ${result.issues.length} non-critical issue(s) found`;
    }
  }

  return result;
}

module.exports = {
  compareHashes,
  createEmptyResult,
  CheckStatus,
  IssueType
};