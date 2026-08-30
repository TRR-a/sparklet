// build-copy-assets.cjs
// Copy non-compiled runtime assets into build/ while mirroring the source tree layout.
// 将非编译的运行时资源按源码目录层级拷贝到 build/（tsc/esbuild 只产出 .js，不搬这些文件）。
//
// tsc emits .js under build/ via outDir, but HTML/CSS/JSON locale/icons are not compiled,
// so this script mirrors them into build/ to make it a self-contained runnable tree.
//
// Exports reusable pieces so watch-copy-assets.cjs can do incremental sync without dup logic.
// 导出可复用部分，watch-copy-assets.cjs 据此做增量同步，避免逻辑重复。
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'build');

// Static asset extensions that must ship to the runtime [需要带到运行时的静态资源扩展名]
const STATIC_EXT = new Set([
  '.html', '.css', '.json',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot',
]);

// Source roots to mirror into build/ [要镜像到 build/ 的源目录 -> build 内目标前缀]
const COPY_ROOTS = [
  { from: 'modules', to: 'modules' },
  { from: 'assets', to: 'assets' },
];

/**
 * Copy a single static asset if its extension is in the whitelist [按白名单复制单个静态资源]
 * @returns true if copied (extension matched) [扩展名命中则复制并返回 true]
 */
function ensureCopyAsset(srcFile, relPath, destPrefix) {
  const ext = path.extname(srcFile).toLowerCase();
  if (!STATIC_EXT.has(ext)) return false;
  const dest = path.join(OUT, destPrefix, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(srcFile, dest);
  return true;
}

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, cb);
    } else if (entry.isFile()) {
      cb(full);
    }
  }
}

/**
 * Full copy pass: mirror all static assets under COPY_ROOTS into build/ [全量复制：将 COPY_ROOTS 下所有静态资源镜像到 build/]
 * @returns number of files copied [复制的文件数]
 */
function copyAllAssets() {
  let copied = 0;
  for (const { from, to } of COPY_ROOTS) {
    const srcRoot = path.join(ROOT, from);
    walk(srcRoot, (file) => {
      const rel = path.relative(srcRoot, file);
      if (ensureCopyAsset(file, rel, to)) copied++;
    });
  }
  return copied;
}

module.exports = { STATIC_EXT, COPY_ROOTS, OUT, ensureCopyAsset, copyAllAssets };

// Run as script [作为脚本直接执行]
if (require.main === module) {
  const copied = copyAllAssets();
  console.log(`[copy-assets] copied ${copied} static asset(s) into build/`);
}
