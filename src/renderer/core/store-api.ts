// Core config-store API (renderer side) [核心配置存储 API (渲染侧)]
// Wraps the store:get / store:set channels [封装 store:get / store:set 通道]

import { bus } from './ipc-bus';

export const storeApi = {
  /** Read a config value [读取配置值] */
  get<T = unknown>(key: string): Promise<T> {
    return bus.invoke<T>('store:get', key);
  },

  /** Write a config value [写入配置值] */
  set(key: string, value: unknown): Promise<void> {
    return bus.invoke('store:set', key, value);
  },
};
