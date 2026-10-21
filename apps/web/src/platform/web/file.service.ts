import { FileService, OpenFileOptions, PlatformFile } from '../types';

export class WebFileService implements FileService {
  async openFile(options?: OpenFileOptions): Promise<PlatformFile[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple ?? false;
      if (options?.accept && options.accept.length > 0) {
        input.accept = options.accept.join(',');
      }

      input.onchange = async () => {
        try {
          const files = input.files;
          if (!files || files.length === 0) {
            resolve([]);
            return;
          }

          const results: PlatformFile[] = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = await file.arrayBuffer();
            results.push({
              name: file.name,
              size: file.size,
              type: file.type || 'application/pdf',
              lastModified: file.lastModified,
              data: new Uint8Array(buffer),
            });
          }
          resolve(results);
        } catch (err) {
          reject(err);
        }
      };

      input.oncancel = () => {
        resolve([]);
      };

      input.click();
    });
  }

  async saveFile(data: Uint8Array | Blob, defaultName: string, mimeType: string = 'application/pdf'): Promise<void> {
    const blob = data instanceof Blob ? data : new Blob([data.buffer as ArrayBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async shareFile(file: PlatformFile): Promise<void> {
    if (navigator.share && navigator.canShare) {
      try {
        const nativeFile = new File([file.data.buffer as ArrayBuffer], file.name, { type: file.type });
        if (navigator.canShare({ files: [nativeFile] })) {
          await navigator.share({
            files: [nativeFile],
            title: file.name,
          });
          return;
        }
      } catch (err) {
        console.warn('Native web share failed, falling back to download:', err);
      }
    }
    // Fallback: trigger standard browser download
    await this.saveFile(file.data, file.name, file.type);
  }
}
