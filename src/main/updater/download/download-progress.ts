// Download: throttled progress reporter [下载 - 节流进度上报]

/** Progress callback type [进度回调类型] */
export type ProgressCallback = (percent: number) => void;

/** Min interval between progress emissions (ms) [进度上报的最小间隔 (毫秒)] */
const PROGRESS_THROTTLE_MS = 200;

/**
 * Create a 200ms-throttled reporter [创建 200 毫秒节流的上报器]
 * @param totalSize Total bytes (0 disables reporting) [总字节数 (0 表示不上报)]
 * @param onProgress Callback receiving 0-100 [接收 0-100 的回调]
 */
export function createProgressReporter(
  totalSize: number,
  onProgress: ProgressCallback | null
): (downloadedSize: number) => void {
  let lastEmitTime = Date.now();
  return (downloadedSize: number): void => {
    if (onProgress && totalSize > 0) {
      const now = Date.now();
      if (now - lastEmitTime > PROGRESS_THROTTLE_MS) {
        const percent = Math.round((downloadedSize / totalSize) * 100);
        onProgress(Math.min(percent, 100));
        lastEmitTime = now;
      }
    }
  };
}
