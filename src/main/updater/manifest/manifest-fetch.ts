// Manifest file reading and downloading - barrel [清单文件读取与下载 - 汇总出口]
//
// Split out [已拆分]：bundled manifest → manifest-read-current.ts,
// remote releases manifest → manifest-fetch-releases.ts.

export { readCurrentManifest } from 'sparklet/main/updater/manifest/manifest-read-current.js';
export { fetchReleasesManifest } from 'sparklet/main/updater/manifest/manifest-fetch-releases.js';
