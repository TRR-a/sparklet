// resources/updater.js
// External updater: extract full win-unpacked ZIP -> overwrite install root
// Windows-safe rename-then-write handles exe/asar/dll even if updater itself is
// running from the same exe/asar (detached, main already quit).

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const unzipper = require('unzipper');
const util = require('util');

// ---------------------------------------------------------------------------
// CLI args (kept 100% compatible with installer.js runExternalUpdater
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let zipPath = null;
let tempDir = null;
let targetVersion = null;
let mainPid = null;
let logFile = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--zip' && i + 1 < args.length) { zipPath = args[i + 1]; i++; continue; }
  if (args[i] === '--temp' && i + 1 < args.length) { tempDir = args[i + 1]; i++; continue; }
  if (args[i] === '--version' && i + 1 < args.length) { targetVersion = args[i + 1]; i++; continue; }
  if (args[i] === '--pid' && i + 1 < args.length) { mainPid = parseInt(args[i + 1], 10); i++; continue; }
  if (args[i] === '--log-file' && i + 1 < args.length) { logFile = args[i + 1]; i++; continue; }
}

// ---------------------------------------------------------------------------
// File logger: tee all console.* calls to --log-file (if provided)
// Must run BEFORE the first console.log so no output is lost.
// ---------------------------------------------------------------------------
let logStream = null;
function teeConsole() {
  if (!logFile) return;
  try {
    fs.ensureDirSync(path.dirname(logFile));
    logStream = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' });
    logStream.on('error', (e) => {
      try { process.stdout.write('[Updater] Log stream error: ' + e.message + '\n'); } catch (_) {}
    });
    const timeTag = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
        + '.' + String(d.getMilliseconds()).padStart(3, '0');
    };
    const writeLine = (level, rawArgs) => {
      if (!logStream) return;
      try {
        const line = '[' + timeTag() + '] [' + level + '] ' + util.format.apply(null, rawArgs) + '\n';
        logStream.write(line);
      } catch (_) { /* best effort */ }
    };
    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    console.log = function () { writeLine('INFO', arguments); origLog.apply(null, arguments); };
    console.warn = function () { writeLine('WARN', arguments); origWarn.apply(null, arguments); };
    console.error = function () { writeLine('ERROR', arguments); origError.apply(null, arguments); };
  } catch (err) {
    logStream = null;
    try { process.stdout.write('[Updater] Failed to init log file: ' + err.message + '\n'); } catch (_) {}
  }
}
teeConsole();

console.log('[Updater] External updater started');
if (logFile) console.log('[Updater] Persistent log file:', logFile);
console.log('[Updater] Params:', { zipPath, tempDir, targetVersion, mainPid, logFile });

const INSTALL_ROOT = path.dirname(process.execPath);
console.log('[Updater] Install root (target):', INSTALL_ROOT);

// ---------------------------------------------------------------------------
// Wait for main process to fully quit (frees locks on exe/dll/asar)
// ---------------------------------------------------------------------------
function waitForMainProcessExit() {
  return new Promise((resolve) => {
    if (!mainPid) {
      console.log('[Updater] No main PID, waiting 2.5s...');
      setTimeout(resolve, 2500);
      return;
    }
    console.log('[Updater] Waiting for main process (PID: ' + mainPid + ') to exit...');
    const checkInterval = setInterval(() => {
      try {
        process.kill(mainPid, 0);
        // 没抛异常 → 进程还在，继续等
      } catch (err) {
        if (err.code === 'ESRCH') {
          clearInterval(checkInterval);
          console.log('[Updater] Main process exited');
          setTimeout(resolve, 500);
        } else {
          console.warn('[Updater] Process check warning:', err.message);
        }
      }
    }, 400);
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('[Updater] Wait timeout (12s), proceeding anyway');
      resolve();
    }, 12000);
  });
}

// ---------------------------------------------------------------------------
// Small helper: pretty-print byte size
// ---------------------------------------------------------------------------
function fmtSize(bytes) {
  if (bytes == null) return '?B';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + 'MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(3) + 'GB';
}

async function statOrNull(p) {
  try { return await fs.stat(p); } catch (_) { return null; }
}

// ---------------------------------------------------------------------------
// Windows-safe file replace: rename -> write. Never overwrite a locked file in-place.
// Verbose logging for every step so you can confirm replace logic truly works.
// ---------------------------------------------------------------------------
async function replaceFileSafely(srcFile, destFile) {
  await fs.ensureDir(path.dirname(destFile));
  const rel = path.relative(INSTALL_ROOT, destFile) || path.basename(destFile);
  const srcStat = await statOrNull(srcFile);
  const destStatBefore = await statOrNull(destFile);
  console.log('[Updater] ── File ──────────────────────────────────────');
  console.log('[Updater] Target   :', destFile);
  console.log('[Updater] (relative): ' + rel);
  console.log('[Updater] Source   :', srcFile);
  console.log('[Updater] Src size :', fmtSize(srcStat && srcStat.size));
  console.log('[Updater] Dest BEFORE: exists=' + !!destStatBefore
    + ' size=' + fmtSize(destStatBefore && destStatBefore.size)
    + ' mtime=' + (destStatBefore && destStatBefore.mtime.toISOString()));

  let renameOk = false;
  let oldFile = null;
  if (destStatBefore) {
    oldFile = destFile + '.old';
    const oldStatBefore = await statOrNull(oldFile);
    if (oldStatBefore) {
      console.log('[Updater] Stale .old detected, removing:', oldFile);
      try { await fs.remove(oldFile); } catch (_) { /* ignore */ }
    }
    try {
      await fs.rename(destFile, oldFile);
      const oldStatAfter = await statOrNull(oldFile);
      const destAfterRename = await statOrNull(destFile);
      renameOk = true;
      console.log('[Updater] Rename OK: ' + destFile + ' -> ' + oldFile);
      console.log('[Updater]   .old exists=' + !!oldStatAfter
        + ' size=' + fmtSize(oldStatAfter && oldStatAfter.size));
      console.log('[Updater]   Dest after rename exists=' + !!destAfterRename);
    } catch (renameErr) {
      // If rename fails (unlikely after main quit), fallback to overwrite.
      console.warn('[Updater] Rename FAILED (fallback to direct overwrite):', renameErr.message);
    }
  } else {
    console.log('[Updater] Dest does not exist (new file), will copy directly');
  }

  console.log('[Updater] Copying source -> dest ...');
  await fs.copy(srcFile, destFile, { overwrite: true });

  const destStatAfter = await statOrNull(destFile);
  console.log('[Updater] Dest AFTER : exists=' + !!destStatAfter
    + ' size=' + fmtSize(destStatAfter && destStatAfter.size)
    + ' mtime=' + (destStatAfter && destStatAfter.mtime.toISOString()));

  let sizeMatch = null;
  if (srcStat && destStatAfter) {
    sizeMatch = srcStat.size === destStatAfter.size;
    const tag = sizeMatch ? '✅' : '⚠️';
    console.log('[Updater] Size comparison (src vs new dest): '
      + fmtSize(srcStat.size) + ' vs ' + fmtSize(destStatAfter.size)
      + ' -> ' + tag + (sizeMatch ? ' match' : ' MISMATCH'));
  }

  if (renameOk && srcStat && destStatAfter && oldFile) {
    const oldStat = await statOrNull(oldFile);
    if (oldStat) {
      console.log('[Updater] Previous version preserved at:', oldFile
        + ' (' + fmtSize(oldStat.size) + '), will be cleaned up later');
    }
  }
  console.log('[Updater] ───────────────────────────────────────────');
}

// ---------------------------------------------------------------------------
// Recursively merge src dir -> dest dir (each file via replaceFileSafely).
// Logs directory traversal and counts so you can follow progress.
// ---------------------------------------------------------------------------
async function recursiveMergeCopy(srcDir, destDir, depth = 0) {
  await fs.ensureDir(destDir);
  const prefix = '  '.repeat(depth);
  const rel = path.relative(INSTALL_ROOT, destDir) || path.basename(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).length;
  const files = entries.filter(e => e.isFile()).length;
  const syms = entries.filter(e => e.isSymbolicLink()).length;
  console.log(`[Updater] ${prefix}+ DIR [${rel}]  (files=${files}, subdirs=${dirs}, symlinks=${syms})`);

  for (const entry of entries) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await recursiveMergeCopy(s, d, depth + 1);
    } else if (entry.isFile()) {
      await replaceFileSafely(s, d);
    } else if (entry.isSymbolicLink()) {
      console.log('[Updater] Handling symlink:', s, '->', d);
      try {
        await fs.remove(d);
        const target = await fs.readlink(s);
        await fs.symlink(target, d);
        console.log('[Updater] Symlink created, target:', target);
      } catch (symErr) {
        console.warn('[Updater] Symlink failed, fallback to copy:', symErr.message);
        await replaceFileSafely(s, d);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------
async function performReplacement() {
  try {
    console.log('[Updater] Starting replacement (v' + (targetVersion || '?') + ')...');
    await waitForMainProcessExit();

    if (!zipPath || !tempDir) {
      throw new Error('Missing --zip or --temp argument');
    }

    const extractDir = path.join(tempDir, 'extracted');
    console.log('[Updater] Extracting ZIP to:', extractDir);
    await fs.ensureDir(extractDir);
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on('error', reject)
        .on('finish', resolve);
    });
    console.log('[Updater] Extraction complete');

    console.log('[Updater] Merging extracted tree into install root...');
    await recursiveMergeCopy(extractDir, INSTALL_ROOT);

    console.log('[Updater] Cleaning up stale .old files (best effort)...');
    try {
      const clean = async (dir) => {
        const ents = await fs.readdir(dir, { withFileTypes: true });
        for (const e of ents) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) {
            await clean(full);
          } else if (e.isFile() && e.name.endsWith('.old')) {
            try {
              await fs.remove(full);
              console.log('[Updater] Removed stale:', full);
            } catch (_) { /* in-use by updater itself — will be gone on next boot */ }
          }
        }
      };
      await clean(INSTALL_ROOT);
    } catch (_) { /* ignore */ }

    console.log('[Updater] Cleaning temp files...');
    try { await fs.remove(extractDir); } catch (_) { /* ignore */ }
    try { await fs.remove(zipPath); } catch (_) { /* ignore */ }
    try { await fs.remove(tempDir); } catch (_) { /* ignore */ }

    console.log('[Updater] Replacement complete. Restarting app...');
    const appExe = process.execPath;
    const child = spawn(appExe, [], { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
    console.log('[Updater] New app launched (PID ' + child.pid + ')');
    closeLogSync();
    process.exit(0);
  } catch (err) {
    console.error('[Updater] FATAL replacement failed:', err && err.stack || err);
    try {
      if (tempDir) await fs.remove(tempDir);
    } catch (_) { /* ignore */ }
    closeLogSync();
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Safely flush + close the log file stream before process.exit so the last
// lines are guaranteed persisted to disk.
// ---------------------------------------------------------------------------
function closeLogSync() {
  if (!logStream) return;
  try {
    logStream.end();
  } catch (_) { /* ignore */ }
  logStream = null;
}

performReplacement();