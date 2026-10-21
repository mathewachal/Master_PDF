import { Platform } from '../types';
import { WebFileService } from './file.service';
import { WebStorageService } from './storage.service';
import { WebClipboardService } from './clipboard.service';
import { WebNetworkService } from './network.service';

export const webPlatform: Platform = {
  type: 'web',
  file: new WebFileService(),
  storage: new WebStorageService(),
  clipboard: new WebClipboardService(),
  network: new WebNetworkService(),
};
