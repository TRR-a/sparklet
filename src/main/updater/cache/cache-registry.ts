// Cache registry & query - register downloaded ZIP, mark successful launch, get/verify cached ZIP [缓存注册与查询 - 注册下载 ZIP、标记成功打开、获取/校验缓存 ZIP]
//
// Split out [已拆分]：register → cache-register.ts, success mark → cache-mark.ts,
// query → cache-query.ts, verify → cache-verify.ts.

export { registerCachedZip } from './cache-register.js';
export { markSuccessFirstLaunch } from './cache-mark.js';
export { getCachedZipPath } from './cache-query.js';
export { verifyCachedZip } from './cache-verify.js';
