// src/shared/update/update-downloader.js
// 全量更新下载器（v0.2.2仅支持全量更新）
const fs = require('fs');
const path = require('path');
const https = require('https');
const { app } = require('electron');

/**
 * 下载更新包到系统临时目录
 * @param {string} downloadUrl 下载地址
 * @param {Function} onProgress 进度回调
 * @returns {Promise<string>} 下载完成后的文件路径
 */
async function downloadUpdate(downloadUrl, onProgress = null) {
  return new Promise((resolve, reject) => {
    const tempDir = app.getPath('temp');
    const fileName = path.basename(downloadUrl);
    const savePath = path.join(tempDir, fileName);

    console.log('开始下载更新包:', downloadUrl);
    console.log('保存路径:', savePath);

    const file = fs.createWriteStream(savePath);
    
    https.get(downloadUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        file.write(chunk);
        
        if (onProgress) {
          const progress = Math.round((downloadedSize / totalSize) * 100);
          onProgress(progress);
        }
      });

      response.on('end', () => {
        file.end();
        console.log('更新包下载完成:', savePath);
        resolve(savePath);
      });

      response.on('error', (err) => {
        file.destroy();
        fs.unlinkSync(savePath);
        reject(err);
      });
    }).on('error', (err) => {
      file.destroy();
      fs.unlinkSync(savePath);
      reject(err);
    });
  });
}

module.exports = {
  downloadUpdate
};