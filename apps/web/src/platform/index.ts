import { Platform } from './types';
import { webPlatform } from './web';

let currentPlatform: Platform = webPlatform;

/**
 * Get the active platform services instance.
 * Automatically resolves to WebPlatform initially; CapacitorPlatform or
 * ElectronPlatform can be registered upon app bootstrap.
 */
export function getPlatform(): Platform {
  return currentPlatform;
}

/**
 * Register a custom platform implementation (e.g. Capacitor or Electron).
 */
export function setPlatform(platform: Platform): void {
  currentPlatform = platform;
}

export * from './types';
