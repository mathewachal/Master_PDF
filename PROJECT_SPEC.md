# PROJECT: Master_PDF

## 0. YOUR ROLE
You are a senior full-stack engineer and architect. Build **Master_PDF**, a premium all-in-one PDF toolkit as a web application. It will later be wrapped with **Capacitor** (Android) and **Electron** (desktop), so every architectural decision must keep that future in mind.

Work autonomously in the phases defined in Section 8. Before writing code, produce a short implementation plan. After each phase: run the build, lint, and tests; fix failures; commit with a clear message; then continue. Don't stop to ask questions. Make sensible assumptions and record them in `docs/DECISIONS.md`.

## 1. PRODUCT GOAL
A fast, privacy-first PDF suite comparable to premium editors (Acrobat Pro, Foxit, PDFelement, Smallpdf). Users open, edit, organize, annotate, sign, convert, secure, and optimize PDFs from one interface.

## 2. TECH STACK (fixed unless a hard blocker appears)
**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui, lucide-react icons
- Zustand for state, TanStack Query for API calls
- `pdfjs-dist` for rendering (run in Web Workers)
- `pdf-lib` for client-side manipulation (merge, split, rotate, reorder, watermark, page numbers, form fill, flatten)
- Konva (react-konva) or Fabric.js for the annotation and editing overlay
- `@dnd-kit` for drag-and-drop page management
- `tesseract.js` as a client-side OCR fallback
- `react-i18next` (English first, i18n-ready), `vitest` + React Testing Library + Playwright

**Backend (FastAPI, Python 3.11+)**
- FastAPI, Pydantic v2, Uvicorn, `python-multipart`
- PyMuPDF: text/image editing, redaction, extraction, search
- pikepdf (qpdf): encryption, linearization, repair, sanitization, metadata
- OCRmyPDF + Tesseract: OCR with multi-language support
- LibreOffice headless: Office/HTML/image to PDF
- `pdf2docx`, `pdfplumber`/`camelot`: PDF to Word and table extraction
- Ghostscript: compression presets, PDF/A conversion
- `pyHanko`: digital certificate signatures
- `pytest`, `ruff`, `mypy`
- Background jobs for heavy tasks (start with FastAPI BackgroundTasks plus an in-memory job store behind an interface so Celery/Redis can replace it later)

**DevOps**
- Docker + docker-compose (frontend, backend with all system dependencies)
- `.env.example`, Makefile or npm scripts for one-command setup, GitHub Actions CI

## 3. CRITICAL ARCHITECTURE RULES (for Capacitor/Electron portability)
1. **Client-first processing.** Everything that can run in the browser (merge, split, rotate, reorder, extract, delete, watermark, page numbers, basic annotate, form fill, e-signature, password-free viewing, image to PDF) MUST run client-side so it works offline in Capacitor and Electron.
2. **Server-only features** (OCR, Office conversion, PDF/A, advanced compression, true text editing, digital signatures, compare, table extraction, AI) go through the FastAPI backend.
3. **Configurable API base URL** via env and runtime settings, so Electron can later spawn the backend as a local sidecar and Capacitor can point to a hosted server.
4. **Abstract all platform access** behind interfaces in `src/platform/`: `FileService` (open, save, share), `StorageService`, `ClipboardService`, `NetworkService`. Implement a `WebPlatform` now, leaving clean slots for `CapacitorPlatform` and `ElectronPlatform`. Never call `window.showOpenFilePicker`, `localStorage`, or similar APIs directly from feature code.
5. **No hard dependency on cookies or server sessions** for core features. Use stateless auth tokens if auth is added.
6. **Responsive and touch-friendly UI** from day one (mobile, tablet, desktop). Support pinch-zoom and touch gestures.
7. **Large file handling**: stream uploads, use Web Workers for CPU-heavy work, lazy-render pages (virtualized list), and keep memory bounded for 500+ page and 100MB+ files.
8. **Privacy**: uploaded files are deleted from the server immediately after processing, or after a configurable TTL of 1 hour at most. Never log file contents. Show a clear "processed locally" or "processed on server" badge per tool.

## 4. FEATURE REQUIREMENTS

### 4.1 Viewer
Continuous and single-page modes, zoom, fit width/page, rotate view, thumbnails sidebar, outline/bookmarks panel, text search with highlight, dark mode, page jump, multi-tab or multi-document workspace, recent files, print.

### 4.2 Organize Pages
- Merge (drag-and-drop ordering, mix PDFs and images)
- Split by page range, every N pages, file size, bookmarks, blank-page separators
- Extract, delete, rotate, reorder, insert (blank or from another PDF), replace, crop pages
- Thumbnail grid with multi-select and undo/redo
- Page numbering, headers/footers, Bates numbering

### 4.3 Edit Content
- Edit existing text inline (font matching, reflow within the text block, spell check), with an honest fallback when fonts are embedded or subset
- Add text boxes, shapes, images, and links
- Replace, resize, move, crop, and delete images
- Edit bookmarks and table of contents, edit metadata
- Watermarks (text or image, tiled or single, opacity, rotation, page range) and backgrounds
- **Redaction**: true, permanent removal of text, images, and metadata. Support search-and-redact with regex and pattern presets (email, phone, SSN, credit card). Verify content is actually gone, not just covered.

### 4.4 Annotate and Review
Highlight, underline, strikethrough, sticky notes, comments with replies, stamps (including custom), freehand pen, shapes, arrows, callouts, measurement tools (distance, area, perimeter with scale calibration), annotation properties panel, export/import comment summary, flatten annotations.

### 4.5 Forms
Fill AcroForms, auto-detect fields in flat PDFs, create forms (text, checkbox, radio, dropdown, list, button, signature fields), field properties, basic calculation and validation, import/export form data (FDF, XFDF, CSV, JSON), flatten.

### 4.6 Signatures
Draw, type, or upload an e-signature (saved signature library), place and resize on pages, initials and date stamps. Digital certificate signing (PKCS#12, timestamping, validation). Signature verification panel. Signing-request workflow with a simple audit trail (design the data model now, implement the basic version).

### 4.7 Convert
- PDF to Word, Excel, PowerPoint, JPG/PNG/TIFF, HTML, TXT, Markdown
- Word, Excel, PowerPoint, images, HTML/URL, and email (EML/MSG) to PDF
- PDF/A (1b, 2b), PDF/X, PDF/UA conversion
- Batch conversion with a progress queue

### 4.8 OCR
Scanned PDF to searchable PDF, multi-language selection, auto deskew/despeckle/rotate, table and layout detection, editable output, per-page progress.

### 4.9 Optimize
Compression presets (Low, Medium, High, Custom DPI and quality) with before/after size, linearize for fast web view, repair corrupted PDFs, remove metadata, hidden data, and unused objects.

### 4.10 Security
Open and permissions passwords, AES-256 encryption, restrict print/copy/edit, remove password (when the user knows it), sanitize document, certificate-based encryption.

### 4.11 Search and Extract
Full-text search (single file and across multiple files), extract text, images, tables (to Excel/CSV), and metadata; compare two PDFs with a side-by-side and overlay diff.

### 4.12 Accessibility
Tagging, reading order editor, alt text editor, accessibility checker (WCAG/PDF/UA) with a fix-it list.

### 4.13 Productivity
Batch processing and saved workflows (chain operations: for example OCR, then compress, then watermark), scan-to-PDF using the device camera with edge detection and cleanup, PDF portfolios, attachments, full undo/redo history across all tools.

### 4.14 AI (optional, behind a feature flag, provider-agnostic interface)
Summarize and chat with a PDF, structured data extraction (invoices, contracts), smart PII detection feeding the redaction tool, translation preserving layout, auto alt-text. Implement as a pluggable `LLMProvider` interface with configurable API keys. The app must work fully with AI disabled.

## 5. UX REQUIREMENTS
- Home screen: grid of tool cards by category, plus search ("Command palette" with Ctrl/Cmd+K), recent files, drag-and-drop anywhere.
- Editor workspace: top toolbar (contextual per tool), left panel (thumbnails/bookmarks/search), right panel (properties), central canvas, bottom status bar.
- Every tool shows a progress bar, a cancel button, clear error messages, and a result screen with Download, Share, and "Open in editor".
- Keyboard shortcuts for all common actions, with a shortcuts help dialog.
- Light/dark theme, WCAG AA contrast, full keyboard navigation, ARIA labels.
- Polished, modern, consistent design system with empty states, skeleton loaders, and toasts.

## 6. PROJECT STRUCTURE
```
Master_PDF/
├── apps/
│   ├── web/                # React + Vite app
│   │   └── src/
│   │       ├── platform/   # FileService, StorageService, etc. (+ WebPlatform)
│   │       ├── core/       # pdf engine wrappers (pdfjs, pdf-lib), workers, undo/redo
│   │       ├── features/   # viewer, organize, edit, annotate, forms, sign,
│   │       │               # convert, ocr, optimize, security, search, a11y, ai
│   │       ├── components/ # shared UI
│   │       ├── store/ hooks/ lib/ i18n/
│   │       └── api/        # typed API client
│   └── api/                # FastAPI app
│       └── app/
│           ├── routers/    # one router per feature area
│           ├── services/   # PyMuPDF, pikepdf, OCR, converters, signing
│           ├── jobs/       # job store + background runner
│           ├── schemas/ core/ (config, security, cleanup)
│           └── tests/
├── docs/                   # ARCHITECTURE.md, DECISIONS.md, API.md, PORTING.md
├── docker-compose.yml
├── Makefile
└── README.md
```
`docs/PORTING.md` must describe exactly what is needed later to wrap the app with Capacitor and Electron, including which features need the backend.

## 7. NON-FUNCTIONAL REQUIREMENTS
- **Security**: validate file type by magic bytes, enforce size limits (configurable), sandbox conversions in temp dirs, sanitize filenames, rate-limit, strict CORS, no secrets in the repo, scan for path traversal.
- **Performance**: first page renders in under 1s for typical files; heavy operations never block the UI thread.
- **Reliability**: every operation has timeouts, cancellation, and cleanup of temp files, including on failure.
- **Quality**: strict TypeScript, no `any` without justification, `ruff` and `mypy` clean, unit tests for core PDF operations, API tests for each endpoint using sample fixtures, Playwright e2e for the key flows (merge, split, edit, redact, OCR, compress, protect).
- **Docs**: README with setup in under 5 commands, API docs via OpenAPI, architecture diagram in Mermaid.

## 8. EXECUTION PHASES (complete in order; commit after each)
**Phase 0, Foundation**: monorepo scaffold, tooling, Docker, CI, design system, platform abstraction layer, app shell, home screen, API skeleton with health check, job system, file cleanup.
**Phase 1, Core MVP**: viewer, thumbnails, search; merge, split, extract, delete, rotate, reorder, insert; compress; password protect/unlock; image to PDF; PDF to images.
**Phase 2, Annotate, Forms, Sign**: all annotation tools, comments, form fill and form creation, e-signature, flatten.
**Phase 3, Edit and Redact**: text and image editing, links, bookmarks, watermarks, backgrounds, page numbers, headers/footers, Bates, true redaction with verification.
**Phase 4, Convert and OCR**: Office/HTML/image/email to PDF, PDF to Word/Excel/PPT/HTML/TXT/MD, OCR, PDF/A, table extraction.
**Phase 5, Advanced**: digital signatures and verification, compare, batch workflows, accessibility tools, scan-to-PDF, portfolios, repair/linearize/sanitize, cross-file search.
**Phase 6, AI and Polish**: AI features behind the flag, i18n pass, performance profiling, accessibility audit, full e2e suite, final docs, `PORTING.md`.

## 9. RULES OF ENGAGEMENT
- Don't stub features silently. If something can't be fully implemented, implement the best working version, mark it clearly in `docs/KNOWN_LIMITATIONS.md`, and keep going.
- Don't invent library APIs; check the installed package docs or types before using them.
- Prefer small, composable modules over large files; keep each file focused.
- Never commit sample files containing real personal data. Generate test PDFs programmatically.
- At the end of each phase, output a summary: what was built, what was tested, what is deferred.

## 10. START NOW
1. Read this entire spec.
2. Write `docs/ARCHITECTURE.md` and a Phase 0 plan.
3. Execute Phase 0, then proceed phase by phase.