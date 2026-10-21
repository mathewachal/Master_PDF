# Master_PDF - Comprehensive Phase-Based Execution Plan

This document outlines the detailed roadmap, technical deliverables, validation criteria, and step-by-step tasks for building **Master_PDF** starting from **Phase 0**.

---

## Execution Overview

| Phase | Title | Primary Focus | Platform Portability Consideration |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Foundation & Architecture** | Monorepo scaffold, tooling, platform abstraction layer, design system, FastAPI skeleton, job manager, file cleanup. | Clean `src/platform/` abstraction for Web, Capacitor, Electron. |
| **Phase 1** | **Core MVP (Client-First Operations)** | Viewer, thumbnails, text search, page organize (merge, split, rotate, delete, reorder), image conversion, compress, password protect. | Runs 100% offline in browser/Capacitor/Electron using Web Workers & `pdf-lib`. |
| **Phase 2** | **Annotate, Forms & Sign** | Vector annotation overlay (Konva/Fabric), sticky notes, comments, AcroForm fill/create, e-signature library, flattening. | Offline-capable drawing and form manipulation. |
| **Phase 3** | **Content Edit & Redaction** | Inline text and image editing, watermarking, bates/page numbering, permanent sanitize/redact with verification. | Hybrid: client visual overlays + backend PyMuPDF deep editing & verified redaction. |
| **Phase 4** | **Conversions & OCR** | PDF to Office (Word/Excel/PPT/MD), Office to PDF (LibreOffice), OCRmyPDF + Tesseract multi-language, table extraction. | Backend service via async background jobs. |
| **Phase 5** | **Advanced Capabilities** | PKCS#12 digital signatures, PDF diff/compare, batch workflows, scanner integration, portfolios, repair/linearize. | Backend pyHanko + pikepdf + browser camera API. |
| **Phase 6** | **AI, Accessibility & Production Polish** | Pluggable `LLMProvider` (chat, summarize, smart PII), a11y checker, i18n pass, Playwright e2e, `PORTING.md`. | Portable packaging readiness and comprehensive documentation. |

---

## Phase 0: Foundation & Core Infrastructure

### Goal
Establish a robust, modular monorepo structure with automated tooling, an abstracted platform layer, a modern UI shell (shadcn/ui + Tailwind), a FastAPI backend skeleton with job queuing and automated file cleanup, and foundational unit/lint/type checks.

### Detailed Breakdown

#### 0.1 Monorepo & Directory Structure
- [ ] Initialize root configuration (`package.json` workspaces or npm workspaces, `.gitignore`, `.editorconfig`).
- [ ] Establish directory structure matching specification:
  - `apps/web`: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui.
  - `apps/api`: Python 3.11+ FastAPI backend with Uvicorn.
  - `docs/`: `ARCHITECTURE.md`, `DECISIONS.md`, `EXECUTION_PLAN.md`, `API.md`, `PORTING.md`, `KNOWN_LIMITATIONS.md`.
- [ ] Create Docker setup (`docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`) and `.env.example`.

#### 0.2 Platform Abstraction Layer (`apps/web/src/platform/`)
- [ ] Define platform interfaces:
  - `FileService`: `openFile(options)`, `saveFile(blob, filename)`, `shareFile(file)`.
  - `StorageService`: `get(key)`, `set(key, val)`, `remove(key)` (abstracting `localStorage` / SQLite / native prefs).
  - `ClipboardService`: `writeText(text)`, `writeBlob(blob)`.
  - `NetworkService`: `isOnline()`, `getBaseApiUrl()`.
- [ ] Implement `WebPlatform` implementing all interfaces without platform leakage.
- [ ] Provide factory / dependency injection: `getPlatform(): PlatformServices`.

#### 0.3 Web Frontend Foundation (`apps/web`)
- [ ] Configure Vite + React + TypeScript with strict compiler options (`strict: true`, `noImplicitAny: true`).
- [ ] Setup Tailwind CSS, `lucide-react`, and shadcn/ui core components (Button, Dialog, DropdownMenu, Tabs, Toast, Progress, Tooltip, Sheet, Input).
- [ ] Implement Zustand state stores:
  - `workspaceStore`: active document(s), active tool, layout panels (left sidebar, right properties panel), theme (light/dark).
  - `toolStore`: current tool parameters, processing state, progress indicators.
- [ ] Build Application Shell:
  - Header: document title, tool search/command palette (`Ctrl+K`), theme switcher, export/download button.
  - Home Screen: Categorized tool grid (Organize, Edit, Convert, Security, Optimize), recent files list, global drag-and-drop zone.
  - Editor Workspace: Contextual top toolbar, collapsible left panel (thumbnails, bookmarks, search), central canvas view area, collapsible right properties panel, status bar (zoom, page number, "processed locally" vs "server" badge).

#### 0.4 API Backend Foundation (`apps/api`)
- [ ] Initialize Python environment, `requirements.txt` / `pyproject.toml` with FastAPI, Uvicorn, Pydantic v2, `python-multipart`.
- [ ] Application architecture:
  - `app/main.py`: CORS configuration, exception handlers, API versioning (`/api/v1`).
  - `app/core/config.py`: typed settings (Pydantic `BaseSettings`), CORS origins, temp file storage, TTL settings.
  - `app/routers/health.py`: `/api/v1/health` endpoint returning system status and available features.
  - `app/jobs/`: in-memory job store with clean `JobStore` interface for async tasks (track job ID, status `PENDING/PROCESSING/COMPLETED/FAILED`, progress percentage, error message, artifact download URL).
  - `app/core/cleanup.py`: automated background file cleanup task purging temp files exceeding TTL (default: 30 minutes).
- [ ] Test suite setup (`pytest`, `httpx` for test client).

#### 0.5 Phase 0 Verification & Acceptance Criteria
- [ ] `apps/web` builds cleanly with Vite (`npm run build`).
- [ ] TypeScript checks pass with zero errors (`tsc --noEmit`).
- [ ] `apps/api` runs and passes health check test (`pytest apps/api/tests`).
- [ ] Platform service abstraction tested and verified in isolation.
- [ ] Git commit: `chore(phase-0): monorepo foundation, platform abstraction, app shell, and api skeleton`.

---

## Phase 1: Core MVP (Client-First Operations)

### Goal
Deliver an offline-first viewer and client-side page manipulation suite using `pdfjs-dist` (via Web Workers) and `pdf-lib`.

### Detailed Breakdown
- [ ] **PDF Rendering Engine (`apps/web/src/core/pdf/`)**:
  - Web Worker integration for `pdfjs-dist` to prevent UI thread lock.
  - Virtualized page rendering for high-page-count PDFs (500+ pages).
  - Zoom levels (50% to 400%, fit width, fit page), rotation (90/180/270).
  - Continuous scroll & single-page view modes.
  - Thumbnail generation and outline/bookmark navigation panel.
  - Full-text search with keyword highlight and match cycling.
- [ ] **Client-Side Page Operations (`apps/web/src/features/organize/`)**:
  - Drag-and-drop page organizer using `@dnd-kit` (multi-select, reorder).
  - Merge: combine multiple PDFs and images into a single document.
  - Split: split by page range, every N pages, or extract specific pages.
  - Page mutations: rotate, delete, insert blank pages, duplicate.
  - Image to PDF & PDF to images (PNG, JPEG, WebP) rendering client-side.
- [ ] **Client-Side Password Security & Optimization**:
  - Encrypt with user/owner password via `pdf-lib`.
  - Unlock password-protected PDFs in viewer.
  - Basic compression / stream optimization client-side.
- [ ] **Verification**:
  - Unit tests for all page operations on sample fixtures.
  - Verification of "Processed Locally" privacy badge.

---

## Phase 2: Annotate, Forms & Sign

### Goal
Provide interactive annotation, AcroForm interaction, and e-signatures.

### Detailed Breakdown
- [ ] **Vector Annotation Layer**:
  - Canvas overlay synced with PDF coordinates.
  - Tools: Text notes, highlight, underline, strikeout, freehand pencil, shapes (rect, circle, arrow, line), stamps.
  - Properties editor: color, stroke width, opacity, font size.
  - Flatten annotations onto the PDF canvas.
- [ ] **Interactive Forms**:
  - Detect and render interactive AcroForm fields (text, checkbox, radio, dropdown).
  - Field value binding and validation.
  - Export form data (JSON, FDF) and form flattening.
- [ ] **E-Signatures**:
  - Draw, type, or upload signature image.
  - Signature library (stored securely via `StorageService`).
  - Drag-and-drop signature placement and resizing.

---

## Phase 3: Content Edit & Redaction

### Goal
Enable deep content modification and certified permanent redaction.

### Detailed Breakdown
- [ ] **Text & Image Content Editing**:
  - Visual element selection and boundary detection.
  - Add text boxes, insert/replace/delete images.
  - Watermark engine: text/image, rotation, opacity, multi-page tiling.
  - Page numbering & Bates numbering generator.
- [ ] **True Redaction Engine**:
  - Search-and-redact with regex patterns (email, phone, SSN, credit cards).
  - Server-side verified redaction via PyMuPDF (removing underlying text/image bytes, not just visual masking).
  - Redaction verification audit check confirming content is completely scrubbed.

---

## Phase 4: Conversions & OCR Engine

### Goal
Build the FastAPI conversion pipeline for heavy format transformations and OCR.

### Detailed Breakdown
- [ ] **OCR Engine**:
  - Asynchronous background job integration.
  - OCRmyPDF + Tesseract backend with multi-language support.
  - Client-side `tesseract.js` fallback for offline / small page count use.
- [ ] **Format Conversions**:
  - PDF to Word (`pdf2docx`), Excel (`camelot`/`pdfplumber`), PPT, Markdown, HTML.
  - Office to PDF conversion pipeline via headless LibreOffice.
  - PDF/A conformance conversion and validation (via Ghostscript / pikepdf).
- [ ] **Job Queue & Progress UX**:
  - Job status polling / streaming updates.
  - Progress bar, cancel button, and immediate download.

---

## Phase 5: Advanced Features & Utilities

### Goal
Enterprise-grade PDF capabilities: digital certificates, diffing, batch workflows, and document repair.

### Detailed Breakdown
- [ ] **Digital Signatures**:
  - PKCS#12 certificate signing using `pyHanko`.
  - Signature validation panel inspecting certificate validity and tampering.
- [ ] **Comparison & Diffing**:
  - Side-by-side visual viewer.
  - Pixel diff and text diff overlay highlighting additions and deletions.
- [ ] **Document Repair & Hygiene**:
  - Corrupt PDF repair using pikepdf / qpdf.
  - Linearization for Fast Web View.
  - Metadata sanitization (strip author, edit history, hidden streams).
- [ ] **Productivity Tools**:
  - Batch workflow builder (e.g. OCR -> Watermark -> Compress).
  - Web camera scan-to-PDF with edge detection.

---

## Phase 6: AI, Accessibility & Packaging Readiness

### Goal
Pluggable AI assistants, accessibility compliance, end-to-end testing, and multi-platform packaging preparation.

### Detailed Breakdown
- [ ] **Pluggable AI Features (Feature-Flagged)**:
  - `LLMProvider` interface (OpenAI, Anthropic, Ollama, custom endpoint).
  - Summarization, Q&A on PDF content, structured data extraction.
  - Seamless zero-dependency operation when AI is disabled.
- [ ] **Accessibility (a11y)**:
  - Reading order editor, tag structure viewer, alt-text generator.
  - WCAG AA accessibility audit on UI components.
- [ ] **Testing & Quality Assurance**:
  - Playwright end-to-end tests covering primary user journeys.
  - Performance audit: first page render < 1s, bounded memory for 500+ page documents.
- [ ] **Portability Documentation (`docs/PORTING.md`)**:
  - Step-by-step instructions for wrapping with Capacitor (Android/iOS) and Electron (Desktop).
  - Local sidecar configuration for backend tools.
