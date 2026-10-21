# Master_PDF: Cross-Platform Porting & Packaging Guide

This guide details how **Master_PDF** is packaged for desktop via **Electron** and mobile via **Capacitor** (iOS & Android), preserving privacy, 100% offline-first client operations, and local sidecar architecture.

---

## Architecture Overview

```
                      +-----------------------------+
                      |      apps/web (React/Vite)  |
                      |   Core PDF Engine & UI      |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
+---------------------------+                 +---------------------------+
|    Electron (Desktop)     |                 |    Capacitor (Mobile)     |
| - Windows (.exe / .msi)   |                 | - Android (.apk / .aab)   |
| - macOS (.dmg / .app)     |                 | - iOS (.ipa)              |
| - Linux (.AppImage/.deb)  |                 +---------------------------+
+-------------+-------------+                               |
              |                                             |
              v (Localhost IPC / HTTP)                      v (Optional Remote Server)
+-----------------------------+               +-----------------------------+
|    Bundled Python Sidecar   |               |   Self-Hosted Cloud / LAN   |
|  (apps/api via PyInstaller) |               |      FastAPI Instance       |
|  PyMuPDF, pikepdf, Tesseract|               |  (OCR, Office Conv, Deep)   |
+-----------------------------+               +-----------------------------+
```

---

## 1. Electron Packaging (Desktop: Windows, macOS, Linux)

Master_PDF on desktop runs as a self-contained application without requiring internet access or pre-installed Python. The frontend runs inside Chromium, while the backend runs as an automated local background sidecar process.

### 1.1 Directory Layout for Desktop
```
desktop/
├── package.json
├── electron-builder.yml
├── src/
│   ├── main.ts              # Electron main process (spawns sidecar, manages windows)
│   ├── preload.ts           # Sandboxed IPC bridge (contextIsolation: true)
│   └── sidecarManager.ts    # Manages Python FastAPI binary lifecycle
└── resources/
    └── bin/
        ├── api-win.exe      # PyInstaller compiled apps/api
        ├── api-mac          # macOS universal binary
        └── api-linux        # Linux x86_64 ELF binary
```

### 1.2 Sidecar Process Lifecycle
In `desktop/src/sidecarManager.ts`:
1. Find an available high-range ephemeral port (e.g., between `49152` and `65535`).
2. Spawn the bundled executable:
   ```ts
   import { spawn, ChildProcess } from 'child_process';
   import path from 'path';

   let sidecar: ChildProcess | null = null;

   export function startSidecar(port: number): Promise<void> {
     return new Promise((resolve, reject) => {
       const binaryPath = path.join(process.resourcesPath, 'bin', process.platform === 'win32' ? 'api-win.exe' : 'api');
       sidecar = spawn(binaryPath, ['--port', String(port), '--host', '127.0.0.1'], {
         stdio: 'pipe',
         windowsHide: true,
       });

       sidecar.stdout?.on('data', (data) => {
         if (data.toString().includes('Application startup complete')) {
           resolve();
         }
       });

       sidecar.on('error', reject);
     });
   }

   export function stopSidecar(): void {
     if (sidecar) {
       sidecar.kill('SIGTERM');
       sidecar = null;
     }
   }
   ```
3. Pass `VITE_API_URL=http://127.0.0.1:${port}` to the web view environment via custom scheme or preload injection.
4. Hook window close: `app.on('before-quit', () => stopSidecar())`.

### 1.3 Building the Standalone Python Sidecar
From `apps/api`:
```bash
pip install pyinstaller
pyinstaller --name api-win \
  --onefile \
  --add-data "app;app" \
  --hidden-import "uvicorn" \
  --hidden-import "pymupdf" \
  --hidden-import "pikepdf" \
  --hidden-import "docx" \
  --hidden-import "openpyxl" \
  run.py
```

### 1.4 Electron Security Checklist
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- CSP headers disabling remote inline scripts and restricting network calls to `http://127.0.0.1:*`.

---

## 2. Capacitor Packaging (Mobile: Android & iOS)

Master_PDF on mobile functions as a fully offline document viewer, editor, and organizer. Operations that require server compute (like deep OCR or LibreOffice conversions) can either be delegated to a user-configured server URL or run through client fallback pipelines.

### 2.1 Initialization
From `apps/web`:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/camera @capacitor/filesystem @capacitor/share @capacitor/preferences
npx cap init Master_PDF com.masterpdf.app --web-dir dist
npx cap add android
npx cap add ios
```

### 2.2 Native Platform Abstraction Injection
In `apps/web/src/platform/index.ts`, swap in native plugins dynamically when running inside a native shell:

```ts
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export class CapacitorPlatform implements IPlatformService {
  async scanCamera(): Promise<Uint8Array | null> {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });

    if (!photo.base64String) return null;
    const binary = atob(photo.base64String);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async shareFile(name: string, data: Uint8Array): Promise<void> {
    const writeResult = await Filesystem.writeFile({
      path: name,
      data: btoa(String.fromCharCode(...data)),
      directory: Directory.Cache,
    });

    await Share.share({
      title: name,
      url: writeResult.uri,
      dialogTitle: 'Share PDF',
    });
  }
}
```

### 2.3 Android Configuration (`AndroidManifest.xml`)
- Storage & Camera permissions:
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  ```
- File intent filters for `.pdf` associations:
  ```xml
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:mimeType="application/pdf" />
  </intent-filter>
  ```

### 2.4 iOS Configuration (`Info.plist`)
- Camera Usage Description:
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>Master_PDF needs camera access to scan documents directly into PDFs.</string>
  <key>NSPhotoLibraryUsageDescription</key>
  <string>Master_PDF needs photos access to import and convert images to PDF.</string>
  ```
- Document Types: Register `com.adobe.pdf` in `CFBundleDocumentTypes` with `LSHandlerRank` set to `Alternate`.

---

## 3. Web Worker & CSP Optimizations

On mobile webviews (WKWebView & Android System WebView), PDF rendering in Web Workers requires explicit Blob URI permissions:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' capacitor: http: https: blob: data: 'unsafe-inline' 'unsafe-eval';
  worker-src 'self' blob:;
  img-src 'self' blob: data: capacitor:;
" />
```

---

## 4. Build Commands Summary

| Target | Build Script | Output Artifact |
|---|---|---|
| **Web App** | `npm run build` | `apps/web/dist/` |
| **FastAPI Backend** | `docker build -t master-pdf-api apps/api` | Docker Image / OCI Container |
| **Electron Windows** | `npm run build:electron-win` | `dist-electron/Master_PDF_Setup.exe` |
| **Electron macOS** | `npm run build:electron-mac` | `dist-electron/Master_PDF.dmg` |
| **Android APK** | `npx cap sync android && cd android && ./gradlew assembleRelease` | `android/app/build/outputs/apk/release/app-release.apk` |
| **iOS IPA** | `npx cap sync ios && xcodebuild -workspace ios/App/App.xcworkspace ...` | `ios/App/build/App.ipa` |
