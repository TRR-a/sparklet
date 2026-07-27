// src/main/updater/download.js
// Download management: download with progress and retry

const https = require('https');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const { DOWNLOAD_TIMEOUT_MS, MAX_RETRY_COUNT, RETRY_DELAY_MS } = require('./constants');

function downloadFile(url, destPath, onProgress = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: { 'User-Agent': 'Sparklet-Updater' },
      timeout: DOWNLOAD_TIMEOUT_MS
    };
    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        resolve({ success: false, error: `Download failed, status: ${res.statusCode}` });
        return;
      }
      const totalSize = parseInt(res.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      let lastEmitTime = Date.now();
      const fileStream = fs.createWriteStream(destPath);
      res.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (onProgress && totalSize > 0) {
          const now = Date.now();
          if (now - lastEmitTime > 200) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            onProgress(Math.min(percent, 100));
            lastEmitTime = now;
          }
        }
      });
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        if (onProgress) onProgress(100);
        resolve({ success: true, error: null });
      });
      fileStream.on('error', (err) => {
        fs.remove(destPath).catch(() => {});
        resolve({ success: false, error: `Write error: ${err.message}` });
      });
    });
    req.on('error', (err) => {
      fs.remove(destPath).catch(() => {});
      resolve({ success: false, error: `Network error: ${err.message}` });
    });
    req.on('timeout', () => {
      req.destroy();
      fs.remove(destPath).catch(() => {});
      resolve({ success: false, error: 'Download timeout' });
    });
  });
}

async function downloadWithRetry(url, destPath, onProgress = null, retries = MAX_RETRY_COUNT) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`[Download] Attempt ${attempt}/${retries}: ${url}`);
    const result = await downloadFile(url, destPath, onProgress);
    if (result.success) {
      console.log('[Download] Download succeeded');
      return { success: true, error: null };
    }
    lastError = result.error;
    console.warn(`[Download] Failed (${attempt}/${retries}):`, lastError);
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  return {
    success: false,
    error: `Download failed after ${retries} attempts: ${lastError}`
  };
}

module.exports = { downloadFile, downloadWithRetry };