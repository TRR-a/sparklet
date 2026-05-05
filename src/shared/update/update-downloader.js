// src/shared/update/update-downloader.js
// 职责：GitHub Releases 安装包下载、本地保存、自动安装触发
// 约束：仅做下载/安装，不包含检测/弹窗逻辑

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { getBaseDirectory, isDevEnvironment } = require('../integrity/file-scanner');

/**
 * 获取临时下载目录
 * @returns {string} 临时目录路径
 */
function getTempDownloadDir() {
  const tempDir = path.join(app.getPath('temp'), 'sparklet-updates');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * 从GitHub下载最新安装包
 * @param {string} downloadUrl 安装包下载地址
 * @param {string} version 版本号
 * @returns {Promise<string>} 本地安装包路径
 */
async function downloadUpdate(downloadUrl, version) {
  // 开发环境：跳过下载，打日志即可
  if (isDevEnvironment()) {
    console.warn('Development environment: download skipped');
    return null;
  }

  if (!downloadUrl) {
    throw new Error('No download URL provided');
  }

  console.log(`Starting download for version v${version}...`);
  console.log(`Download URL: ${downloadUrl}`);

  const fetch = require('node-fetch');
  const tempDir = getTempDownloadDir();
  const fileName = `sparklet-setup-v${version}.exe`;
  const filePath = path.join(tempDir, fileName);

  // 发起下载请求
  const response = await fetch(downloadUrl, {
    headers: { 'User-Agent': 'Sparklet-App' },
    timeout: 60000 // 60秒超时
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  // 流式写入文件
  const fileStream = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`Download completed: ${filePath}`);
  return filePath;
}

/**
 * 执行安装包并退出当前应用
 * @param {string} installerPath 本地安装包路径
 */
async function runInstaller(installerPath) {
  // 开发环境：跳过安装，打日志即可
  if (isDevEnvironment()) {
    console.warn('Development environment: installer run skipped');
    return;
  }

  if (!fs.existsSync(installerPath)) {
    throw new Error('Installer file not found');
  }

  console.log(`Running installer: ${installerPath}`);

  const { spawn } = require('child_process');
  
  // 启动安装包（Windows专用，使用start命令避免阻塞）
  spawn('cmd.exe', ['/c', 'start', '', installerPath], {
    detached: true,
    stdio: 'ignore'
  });

  // 退出当前应用
  app.quit();
}

module.exports = {
  downloadUpdate,
  runInstaller,
  getTempDownloadDir
};