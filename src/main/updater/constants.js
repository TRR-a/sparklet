// src/main/updater/constants.js
// 更新模块常量配置

const path = require('path');
const { app } = require('electron');

// GitHub 仓库信息
const GITHUB_OWNER = 'TRR-a';
const GITHUB_REPO = 'sparklet';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// 临时目录配置（三个候选，按优先级）
const TEMP_DIR_NAMES = [
  'Sparklet-UpdateTemp',
  'sparklet-updater',
  'sparklet-update-cache'
];

// 重试配置
const MAX_RETRY_COUNT = 6;
const RETRY_DELAY_MS = 2000; // 重试间隔（毫秒）

// 超时配置
const DOWNLOAD_TIMEOUT_MS = 60000; // 下载超时 60 秒
const REQUEST_TIMEOUT_MS = 30000;  // HTTP 请求超时 30 秒

// 命令行禁用参数
const DISABLE_UPDATE_FLAGS = ['--no-update', '--disable-update'];

// 更新包文件名格式
const PACKAGE_NAME_PATTERN = /^Sparklet-v\d+\.\d+\.\d+\.zip$/;

// 获取应用根目录（打包后为 resources/app）
function getAppRoot() {
  return app.getAppPath();
}

// 获取用户数据目录
function getUserDataPath() {
  return app.getPath('userData');
}

// 获取临时目录路径
function getTempPath() {
  return app.getPath('temp');
}

// 获取外部更新器路径
function getUpdaterScriptPath() {
  // 开发环境：项目根目录下的 resources/
  // 打包后：resources/ 目录（与 app 同级）
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'updater.js');
  } else {
    return path.join(app.getAppPath(), '../resources/updater.js');
  }
}

module.exports = {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_API_URL,
  TEMP_DIR_NAMES,
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  DOWNLOAD_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
  DISABLE_UPDATE_FLAGS,
  PACKAGE_NAME_PATTERN,
  getAppRoot,
  getUserDataPath,
  getTempPath,
  getUpdaterScriptPath
};