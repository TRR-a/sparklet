// Update check: result builders [更新检查 - 结果构造]
//
// Split out [已拆分]：fetch failure → check-result-fetch-failure.ts,
// invalid release → check-result-invalid.ts, success → check-result-success.ts.

export { buildFetchFailureResult } from 'sparklet/main/updater/check/check-result-fetch-failure.js';
export { buildInvalidReleaseResult } from 'sparklet/main/updater/check/check-result-invalid.js';
export { buildCheckResult } from 'sparklet/main/updater/check/check-result-success.js';
