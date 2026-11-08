// Cache registry & query - register downloaded ZIP, mark successful launch, get/verify cached ZIP [缓存注册与查询 - 注册下载 ZIP、标记成功打开、获取/校验缓存 ZIP]
//
// Split out [已拆分]：register → cache-register.ts, success mark → cache-mark.ts,
// query → cache-query.ts, verify → cache-verify.ts.

export { registerCachedZip } from 'sparklet/main/updater/cache/cache-register.js';
export { markSuccessFirstLaunch } from 'sparklet/main/updater/cache/cache-mark.js';
export { getCachedZipPath } from 'sparklet/main/updater/cache/cache-query.js';
export { verifyCachedZip } from 'sparklet/main/updater/cache/cache-verify.js';
