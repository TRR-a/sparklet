// Dev user-data redirect [开发环境 userData 重定向]
// Must be imported BEFORE any module that touches app.getPath('userData')
// [必须在任何访问 userData 的模块之前 import]
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

if (!app.isPackaged) {
  const devDataDir = path.join(app.getAppPath(), 'app_data', 'sparklet-dev');
  fs.mkdirSync(devDataDir, { recursive: true });
  app.setPath('userData', devDataDir);
  console.log('[Dev] userData redirected to:', devDataDir);
}
