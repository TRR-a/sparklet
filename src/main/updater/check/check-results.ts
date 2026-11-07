// Update check: result builders [更新检查 - 结果构造]
//
// Split out [已拆分]：fetch failure → check-result-fetch-failure.ts,
// invalid release → check-result-invalid.ts, success → check-result-success.ts.

export { buildFetchFailureResult } from './check-result-fetch-failure.js';
export { buildInvalidReleaseResult } from './check-result-invalid.js';
export { buildCheckResult } from './check-result-success.js';
