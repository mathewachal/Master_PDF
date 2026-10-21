import { describe, it, expect, beforeEach } from 'vitest';
import { getPlatform, setPlatform } from '../index';
import { WebStorageService } from '../web/storage.service';
import { WebNetworkService } from '../web/network.service';

describe('Platform Abstraction Layer', () => {
  it('should initialize with default WebPlatform services', () => {
    const platform = getPlatform();
    expect(platform).toBeDefined();
    expect(platform.type).toBe('web');
    expect(platform.file).toBeDefined();
    expect(platform.storage).toBeDefined();
    expect(platform.clipboard).toBeDefined();
    expect(platform.network).toBeDefined();
  });

  it('should allow setting a custom platform instance', () => {
    const original = getPlatform();
    setPlatform({ ...original, type: 'electron' });
    expect(getPlatform().type).toBe('electron');
    setPlatform(original);
  });

  describe('WebStorageService', () => {
    let storage: WebStorageService;

    beforeEach(async () => {
      storage = new WebStorageService();
      await storage.clear();
    });

    it('should store, retrieve, and remove items', async () => {
      await storage.setItem('theme', 'dark');
      const val = await storage.getItem<string>('theme');
      expect(val).toBe('dark');

      await storage.removeItem('theme');
      const deleted = await storage.getItem<string>('theme');
      expect(deleted).toBeNull();
    });

    it('should correctly clear stored items', async () => {
      await storage.setItem('key1', { foo: 'bar' });
      await storage.clear();
      const val = await storage.getItem('key1');
      expect(val).toBeNull();
    });
  });

  describe('WebNetworkService', () => {
    it('should return and update API base URL', () => {
      const network = new WebNetworkService();
      expect(network.getApiBaseUrl()).toBeDefined();

      network.setApiBaseUrl('https://api.masterpdf.local/');
      expect(network.getApiBaseUrl()).toBe('https://api.masterpdf.local');
    });
  });
});
