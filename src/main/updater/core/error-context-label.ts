// Updater error: stage label [更新器错误 - 阶段中文标签]

/** Which stage the error occurred in [错误发生的阶段] */
export type ErrorContext = 'check' | 'download-zip' | 'download-manifest' | 'verify' | 'install';

/** Human-readable Chinese label for the stage [阶段的中文标签] */
export function contextLabel(context: ErrorContext): string {
  switch (context) {
    case 'download-zip':     return '下载更新包';
    case 'download-manifest':return '获取版本信息';
    case 'verify':           return '校验安装包';
    case 'install':          return '安装更新';
    case 'check':
    default:                 return '检查更新';
  }
}
