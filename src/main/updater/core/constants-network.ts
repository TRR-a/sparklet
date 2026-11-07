// Updater constants: retry / timeout / filename [更新常量 - 重试、超时、文件名]

// Retry config [重试配置]
export const MAX_RETRY_COUNT = 6;
export const RETRY_DELAY_MS = 2000;

// Timeout config [超时配置]
export const DOWNLOAD_TIMEOUT_MS = 60000;
export const REQUEST_TIMEOUT_MS = 30000;

// Update package filename pattern [更新包文件名格式]
export const PACKAGE_NAME_PATTERN = /^sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip$/;

// Command-line disable flags [命令行禁用参数]
export const DISABLE_UPDATE_FLAGS = ['--no-update', '--disable-update'];
