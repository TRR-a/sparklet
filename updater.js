// updater.js - Sparklet 外部更新器（v0.2.2 全量更新版）
// 由主程序启动，主程序退出后执行文件替换
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const unzipper = require('unzipper');

// 解析命令行参数
const args = process.argv.slice(2);
const updatePackagePath = args[0]; // 更新包zip路径
const appPath = args[1]; // 应用根目录路径
const mainPid = parseInt(args[2]); // 主程序PID

console.log('Sparklet 更新器启动');
console.log('更新包路径:', updatePackagePath);
console.log('应用路径:', appPath);
console.log('主程序PID:', mainPid);

// 等待主程序退出
async function waitForMainProcessExit() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      try {
        // 检查进程是否存在（Windows 专用）
        exec(`tasklist /FI "PID eq ${mainPid}"`, (err, stdout) => {
          if (err || !stdout.includes(mainPid.toString())) {
            clearInterval(checkInterval);
            console.log('主程序已退出，开始更新');
            resolve();
          }
        });
      } catch (err) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);
  });
}

// 解压更新包
async function extractUpdatePackage() {
  console.log('开始解压更新包...');
  const extractPath = path.join(appPath, 'update_temp');
  
  // 清理旧的临时目录
  if (fs.existsSync(extractPath)) {
    fs.rmSync(extractPath, { recursive: true, force: true });
  }
  fs.mkdirSync(extractPath);

  return new Promise((resolve, reject) => {
    fs.createReadStream(updatePackagePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on('close', () => {
        console.log('更新包解压完成');
        resolve(extractPath);
      })
      .on('error', reject);
  });
}

// 递归复制文件
function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`已替换: ${destPath}`);
    }
  }
}

// 替换应用文件
async function replaceAppFiles(extractPath) {
  console.log('开始替换应用文件...');
  
  // 找到解压后的sparklet根目录（处理zip包可能包含的外层文件夹）
  let sparkletRoot = extractPath;
  const entries = fs.readdirSync(extractPath);
  if (entries.length === 1 && fs.statSync(path.join(extractPath, entries[0])).isDirectory()) {
    sparkletRoot = path.join(extractPath, entries[0]);
  }

  // 复制所有文件到应用根目录
  copyDirectory(sparkletRoot, appPath);
  console.log('所有文件替换完成');

  // 清理临时文件
  fs.rmSync(extractPath, { recursive: true, force: true });
  fs.unlinkSync(updatePackagePath);
  console.log('临时文件已清理');
}

// 重启主程序
function restartMainApp() {
  console.log('重启主程序...');
  const mainExePath = path.join(appPath, 'node_modules/.bin/electron.cmd');
  exec(`"${mainExePath}" "${appPath}"`, (err) => {
    if (err) {
      console.error('重启主程序失败:', err);
    }
    process.exit(0);
  });
}

// 主流程
async function main() {
  try {
    await waitForMainProcessExit();
    const extractPath = await extractUpdatePackage();
    await replaceAppFiles(extractPath);
    restartMainApp();
  } catch (err) {
    console.error('更新失败:', err);
    alert(`更新失败: ${err.message}\n请手动下载更新包替换文件`);
    process.exit(1);
  }
}

main();