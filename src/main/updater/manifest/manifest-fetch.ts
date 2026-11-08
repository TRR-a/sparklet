// Manifest file reading and downloading - barrel [清单文件读取与下载 - 汇总出口]
//
// Split out [已拆分]：bundled manifest → manifest-read-current.ts,
// remote releases manifest → manifest-fetch-releases.ts.

export { readCurrentManifest } from './manifest-read-current.js';
export { fetchReleasesManifest } from './manifest-fetch-releases.js';
