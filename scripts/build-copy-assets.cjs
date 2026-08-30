// build-copy-assets.cjs
// Copy non-compiled runtime assets into build/ while mirroring the source tree layout.
// 将非编译的运行时资源按源码目录层级拷贝到 build/（tsc/esbuild 只产出 .js，不搬这些文件）。
//
// tsc emits .js under build/ via outDir, but HTML/CSS/JSON locale/icons are not compiled,
// so this script mirrors them into build/ to make it a self-contained runnable tree.
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

let copied = 0;

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

function ensureCopy(srcFile, relPath, destPrefix) {
  const ext = path.extname(srcFile).toLowerCase();
  if (!STATIC_EXT.has(ext)) return;
  const dest = path.join(OUT, destPrefix, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(srcFile, dest);
  copied++;
}

for (const { from, to } of COPY_ROOTS) {
  const srcRoot = path.join(ROOT, from);
  walk(srcRoot, (file) => {
    const rel = path.relative(srcRoot, file);
    ensureCopy(file, rel, to);
  });
}

console.log(`[copy-assets] copied ${copied} static asset(s) into build/`);
