// Two-layer verification: manifest integrity + SHA256 - barrel [双层校验：清单完整性 + SHA256 - 汇总出口]
// Update package verification only; runtime integrity checks (exe self-check, installed files) moved to integrity-self-check.ts / integrity-files-verify.ts [仅更新包校验；运行时完整性校验 (exe 自检、已安装文件) 已移至 integrity-self-check.ts / integrity-files-verify.ts]
// Hash & version helpers in hash-utils.ts, re-exported here to keep import paths stable [哈希与版本工具在 hash-utils.ts，此处重新导出以保持导入路径稳定]
//
// Split out [已拆分]：layer 1 → verify-manifest-release.ts, layer 2 → verify-package.ts.

export { normalizeVersion, computeSha256, getHashField } from './hash-utils.js';
export { verifyReleaseManifest } from './verify-manifest-release.js';
export { verifyPackageIntegrity } from './verify-package.js';
