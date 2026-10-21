# Master_PDF Architecture & Design Decisions (ADR)

## DECISION-001: Monorepo Architecture with npm Workspaces
- **Status:** Accepted
- **Context:** Master_PDF comprises a React/Vite frontend and a FastAPI backend, designed for future packaging with Capacitor and Electron.
- **Decision:** Use a clean monorepo structure with `apps/web` and `apps/api`. Root `package.json` coordinates frontend scripts and tooling, while `apps/api` maintains independent Python dependencies via `pyproject.toml` / `requirements.txt`.
- **Consequence:** Easy unified development workflows and smooth packaging into Electron (running `apps/web` + local sidecar `apps/api`).

---

## DECISION-002: Client-First Processing Boundary
- **Status:** Accepted
- **Context:** Privacy is a first-class requirement. In addition, mobile and desktop apps should function offline whenever possible.
- **Decision:** All operations achievable within browser constraints (viewing, search, split, merge, rotate, reorder, basic annotations, form filling, e-signatures, client compression) run client-side using `pdfjs-dist` in Web Workers and `pdf-lib`.
- **Consequence:** Server resources are preserved for heavy operations (OCR, LibreOffice conversions, true byte redaction, PKCS#12 digital signatures). Users have clear visibility via a "Processed locally" badge.

---

## DECISION-003: Platform Abstraction Layer
- **Status:** Accepted
- **Context:** Direct browser API usage (`window.showOpenFilePicker`, `localStorage`, `navigator.clipboard`) creates tight coupling to the browser, complicating Capacitor and Electron ports.
- **Decision:** Introduce a uniform platform abstraction layer under `apps/web/src/platform/` with interfaces (`FileService`, `StorageService`, `ClipboardService`, `NetworkService`). Implement `WebPlatform` first.
- **Consequence:** Zero platform-specific code in feature components; Capacitor and Electron can inject native implementations without modifying UI code.

---

## DECISION-004: In-Memory Async Job Store with Clean Interface
- **Status:** Accepted
- **Context:** Server tasks (OCR, conversions) take time and require background execution without blocking HTTP requests.
- **Decision:** Provide an in-memory `JobStore` class backed by an interface `IJobStore`.
- **Consequence:** Lightweight local execution without requiring Redis or Celery immediately, while allowing zero-friction drop-in replacement when scaling.

---

## DECISION-005: Sandboxed Temp File Lifecycle & TTL
- **Status:** Accepted
- **Context:** Uploaded user files must be protected and purged promptly to comply with privacy requirements.
- **Decision:** Store temporary job artifacts in isolated directories named by UUID. Run an automated background cleanup worker purging files older than 30 minutes, and purge immediately upon client download when requested.
- **Consequence:** Server avoids storage leaks and respects user privacy.

---

## DECISION-006: Client-Side Core Engine Integration (`pdfjs-dist` + `pdf-lib`)
- **Status:** Accepted
- **Context:** Phase 1 requires fast viewing, page organization, and client-side conversions without locking the browser UI thread.
- **Decision:** Use `pdfjs-dist` running via Vite Web Worker module (`pdf.worker.mjs?url`) for viewport rendering, high-DPI scaling, and thumbnail generation. Use `pdf-lib` for in-memory page mutations (merge, split, rotate, delete, insert, reorder, image-to-PDF).
- **Consequence:** 100% offline capability for core PDF manipulation; snappy performance even on large documents.

---

## DECISION-007: AES-256 PDF Encryption via `pikepdf` Service
- **Status:** Accepted
- **Context:** Standard PDF-1.7/2.0 AES-256 password protection and granular permission enforcement (printing, assembly, annotation permissions) requires cryptographic standards compliance.
- **Decision:** Implement PDF protection and decryption in the FastAPI backend via `pikepdf` (QPDF wrapper), while `pdfjs-dist` on the client handles encrypted document detection and password prompting.
- **Consequence:** Bulletproof AES-256 encryption without browser bundle bloat.
