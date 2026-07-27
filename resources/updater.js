// resources/updater.js
// External updater: replace main process files and restart app

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const unzipper = require('unzipper');

const args = process.argv.slice(2);
let zipPath = null, tempDir = null, targetVersion = null, mainPid = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--zip' && i + 1 < args.length) { zipPath = args[i + 1]; i++; }
  else if (args[i] === '--temp' && i + 1 < args.length) { tempDir = args[i + 1]; i++; }
  else if (args[i] === '--version' && i + 1 < args.length) { targetVersion = args[i + 1]; i++; }
  else if (args[i] === '--pid' && i + 1 < args.length) { mainPid = parseInt(args[i + 1], 10); i++; }
}

console.log('[Updater] External updater started');
console.log('[Updater] Params:', { zipPath, tempDir, targetVersion, mainPid });

function waitForMainProcessExit() {
  return new Promise((resolve) => {
    if (!mainPid) {
      console.log('[Updater] No main PID, waiting 2 seconds...');
      setTimeout(resolve, 2000);
      return;
    }
    console.log('[Updater] Waiting for main process (PID: ' + mainPid + ') to exit...');
    try {
      const checkInterval = setInterval(() => {
        try {
          const isWindows = process.platform === 'win32';
          const cmd = isWindows ? `tasklist /FI "PID eq ${mainPid}"` : `ps -p ${mainPid}`;
          require('child_process').exec(cmd, (error, stdout) => {
            if (error || !stdout.includes(mainPid.toString())) {
              clearInterval(checkInterval);
              console.log('[Updater] Main process exited');
              resolve();
            }
          });
        } catch (err) {
          console.log('[Updater] Process check error, assuming exited');
          resolve();
        }
      }, 500);
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('[Updater] Wait timeout, proceeding');
        resolve();
      }, 10000);
    } catch (err) {
      console.log('[Updater] Wait error:', err.message);
      resolve();
    }
  });
}

function getAppRoot() {
  return path.join(__dirname, 'app');
}

async function performReplacement() {
  try {
    console.log('[Updater] Starting replacement...');
    await waitForMainProcessExit();
    const extractDir = path.join(tempDir, 'extracted');
    console.log('[Updater] Extracting to:', extractDir);
    await fs.ensureDir(extractDir);
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on('error', reject)
        .on('finish', resolve);
    });
    console.log('[Updater] Extraction complete');
    const appRoot = getAppRoot();
    console.log('[Updater] App root:', appRoot);
    const mainSrcDir = path.join(appRoot, 'src', 'main');
    if (await fs.pathExists(mainSrcDir)) {
      console.log('[Updater] Removing old main process directory:', mainSrcDir);
      await fs.remove(mainSrcDir);
    }
    const newMainSrc = path.join(extractDir, 'src', 'main');
    if (await fs.pathExists(newMainSrc)) {
      console.log('[Updater] Copying new main process files:', newMainSrc);
      await fs.copy(newMainSrc, mainSrcDir, { overwrite: true });
    } else {
      console.warn('[Updater] No src/main/ found in update package');
    }
    const srcDir = path.join(appRoot, 'src');
    const assetsDir = path.join(appRoot, 'assets');
    const newRenderDir = path.join(extractDir, 'src', 'renderer');
    if (await fs.pathExists(newRenderDir)) {
      console.log('[Updater] Updating renderer directory');
      const targetRender = path.join(srcDir, 'renderer');
      await fs.copy(newRenderDir, targetRender, { overwrite: true });
    }
    const newAssetsDir = path.join(extractDir, 'assets');
    if (await fs.pathExists(newAssetsDir)) {
      console.log('[Updater] Updating assets directory');
      await fs.copy(newAssetsDir, assetsDir, { overwrite: true });
    }
    const newManifest = path.join(extractDir, 'manifest.current.json');
    if (await fs.pathExists(newManifest)) {
      console.log('[Updater] Updating manifest.current.json');
      await fs.copy(newManifest, path.join(appRoot, 'manifest.current.json'), { overwrite: true });
    }
    console.log('[Updater] Cleaning up temp files...');
    await fs.remove(extractDir);
    await fs.remove(zipPath);
    await fs.remove(tempDir);
    console.log('[Updater] Replacement complete');
    console.log('[Updater] Restarting app...');
    const appExe = process.execPath;
    const appArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--zip') && !arg.startsWith('--temp') && !arg.startsWith('--version') && !arg.startsWith('--pid'));
    const child = spawn(appExe, appArgs, { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
    console.log('[Updater] New app launched');
    process.exit(0);
  } catch (err) {
    console.error('[Updater] Replacement failed:', err);
    try { if (tempDir) await fs.remove(tempDir); } catch (_) {}
    process.exit(1);
  }
}

performReplacement();