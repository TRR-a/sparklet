// Rollback: release URL + external open [回滚 - release 链接与外部打开]

import { shell } from 'electron';
import { GITHUB_OWNER, GITHUB_REPO } from 'sparklet/main/updater/constants/constants.js';

/** Build the GitHub release page URL for a version [构造某版本的 GitHub release 页面链接] */
export function buildReleaseUrl(versionWithV: string): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${versionWithV}`;
}

/** Open the release page in the default browser (best effort) [用默认浏览器打开 release 页面 (尽力而为)] */
export function openReleasePage(url: string): void {
  shell.openExternal(url).catch(() => {});
}
