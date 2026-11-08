// Welcome: clock format bootstrap + live follow [欢迎页 - 时钟制式初始化与实时跟随]

import { storeApi, broadcastApi } from '../../../shared/index.js';
import { setUse12Hour, tickClocks } from '../../clock/scripts/welcome-clock.js';

/** Read the saved clock format once, then follow the settings toggle [先读一次时钟制式，随后跟随设置开关] */
export async function initClockFormat(): Promise<void> {
  // Clock format: read once, then follow the settings toggle live [时钟制式：先读一次，随后实时跟随设置开关]
  setUse12Hour((await storeApi.get<boolean>('clock12Hour')) === true);
  broadcastApi.onClockFormatBroadcast((enabled) => {
    setUse12Hour(Boolean(enabled));
    tickClocks();
  });
}
