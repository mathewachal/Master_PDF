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

---

## DECISION-008: Vector Annotation Overlay & Bottom-Left Coordinate Mapping
- **Status:** Accepted
- **Context:** Annotations (freehand, shapes, stamps, notes, measurements) must render seamlessly over PDF canvases and be burnable directly into PDF content streams.
- **Decision:** Use an SVG vector overlay synchronized to the page scale and viewport dimensions for interaction. On "Flatten", translate browser top-left coordinates to PDF bottom-left coordinates (`pageHeight - y - height`) and burn primitives using `pdf-lib`.
- **Consequence:** Flawless visual accuracy, zero external canvas library overhead, and 100% offline vector flattening into PDF streams.

---

## DECISION-009: Interactive AcroForm Management & JSON Data Binding
- **Status:** Accepted
- **Context:** Users need to inspect, fill, create, import/export, and permanently flatten interactive form fields.
- **Decision:** Leverage `pdf-lib`'s AcroForm API for reading field types (`PDFTextField`, `PDFCheckBox`, `PDFDropdown`, `PDFRadioGroup`), filling values, and creating new fields. Expose JSON data binding for import/export.
- **Consequence:** Standard-compliant AcroForm operations running entirely client-side without external dependencies.

---

## DECISION-010: Document Decorations & Bates Numbering via `pdf-lib`
- **Status:** Accepted
- **Context:** Watermarking, tiled background stamps, legal Bates numbering, and dynamic page numbering must run offline in the browser.
- **Decision:** Implement text and image watermarks with configurable opacity, angle, and tiled grids using `pdf-lib`. Bates numbering generates formatted sequence tokens (e.g., `CONFIDENTIAL-000001`) with configurable prefix/suffix, digit padding, font size, and 6 standard anchor positions.
- **Consequence:** Fast, offline document stamping without transmitting files to server.

---

## DECISION-011: Certified Deep Byte-Level Redaction via PyMuPDF (`fitz`)
- **Status:** Accepted
- **Context:** Blacking out text with client-side overlays is dangerous and leaves underlying text and vector streams intact in the PDF file (a frequent source of data leaks).
- **Decision:** Perform true permanent redaction server-side using PyMuPDF (`fitz`), utilizing `page.add_redact_annot()` followed by `page.apply_redactions()`. Provide built-in regex presets for PII (emails, US phone numbers, SSNs, credit cards) and coordinate-based bounding box scrubbing. Implement automated post-redaction audit verification (`verify_clean`) to ensure zero matching strings remain in the file.
- **Consequence:** Certified zero-leak redaction compliance for sensitive legal, financial, and healthcare documents.

---

## DECISION-012: Multi-Format Document Conversion Pipeline
- **Status:** Accepted
- **Context:** Users require bi-directional document transformation between PDF and Word (.docx), Excel (.xlsx), CSV, Markdown (.md), Plain Text (.txt), HTML, and archival PDF/A standards.
- **Decision:** Implement specialized converter pipelines:
  - `PDF -> Markdown`: powered by `pymupdf4llm` preserving headings, lists, tables, and typography.
  - `PDF -> Word (.docx)`: builds structured `.docx` documents using `python-docx`, parsing PDF text blocks and detected tables.
  - `PDF -> HTML`: outputs responsive, standalone HTML with typography styling.
  - `PDF -> PDF/A`: standardizes PDF conformance to ISO 19005 (PDF/A-1b / PDF/A-2b) with embedded color profiles and linearization via `pikepdf`.
  - `Text/Markdown -> PDF`: parses typography and headings into paginated PDF layouts using PyMuPDF.
- **Consequence:** High-fidelity document conversions without heavyweight external dependencies.

---

## DECISION-013: Layout-Aware Table Extraction & Structured Export
- **Status:** Accepted
- **Context:** Financial, legal, and operational documents contain critical tabular data that users need to extract into spreadsheets or databases.
- **Decision:** Use PyMuPDF's `find_tables()` engine to detect explicit and whitespace-based table boundaries, extracting cell contents, row headers, and geometry coordinates. Export extracted tables to styled multi-sheet Excel workbooks via `openpyxl` with auto-fit column widths and alternating row colors, or to raw CSV / JSON.
- **Consequence:** 1-click table extraction with instant preview and formatted Excel export.

---

## DECISION-014: Multi-Language OCR Architecture with Searchable PDF Generation
- **Status:** Accepted
- **Context:** Scanned PDFs and mobile camera snapshots require optical character recognition to become searchable and indexable.
- **Decision:** Provide an OCR router supporting multi-language ISO codes (`eng`, `spa`, `fra`, `deu`, `ita`, `por`, `chi_sim`, `jpn`, `rus`, `ara`, `hin`), auto-deskewing, and multiple output targets: searchable PDF (invisible OCR text layer rendered over the scanned image), structured Markdown, or clean text.
- **Consequence:** Scanned documents can be searched, copied, and edited while preserving original page scans.

---

## DECISION-015: PKCS#12 Digital Signature Certification & Cryptographic Verification
- **Status:** Accepted
- **Context:** Legal, banking, and enterprise agreements require standard digital signatures adhering to PAdES / PKCS#7 specifications.
- **Decision:** Implement digital signature inspection and cryptographic signing using `cryptography` and `pikepdf`. The backend verifies X.509 certificate chains, byte ranges, validity timestamps, and signer identity. Users can sign documents with their PKCS#12 (.pfx/.p12) credentials or generate test certificates for local certification.
- **Consequence:** Standard-compliant digital signatures without reliance on expensive third-party SaaS signing APIs.

---

## DECISION-016: Document Structural Maintenance (Linearization, Repair, Sanitization)
- **Status:** Accepted
- **Context:** PDFs are frequently shared on web browsers, corrupted by network transfers, or leaked with tracking metadata and embedded scripts.
- **Decision:** Implement automated maintenance pipelines via `pikepdf`:
  - Linearization orders PDF objects for progressive byte-range streaming ("Fast Web View").
  - Repair reconstructs damaged cross-reference tables and regenerates missing object references.
  - Sanitization permanently removes embedded JavaScript triggers, Launch actions, attachments, XFA forms, and XMP tracking metadata.
- **Consequence:** Bulletproof document health, web performance, and security compliance.

---

## DECISION-017: Multi-Document Text & Structural Diffing
- **Status:** Accepted
- **Context:** Contract negotiations and revisions require rapid detection of textual and structural alterations across PDF versions.
- **Decision:** Implement a dual-tier comparison engine. The backend analyzes text stream blocks across corresponding pages via unified diff algorithms, extracting added/deleted lines and modification metrics. The frontend renders side-by-side comparison with green/red line diff highlights.
- **Consequence:** Instant, visual contract change auditing across revisions.

---

## DECISION-018: Multi-Step Batch Automation and Camera Document Scanning
- **Status:** Accepted
- **Context:** Enterprise workflows often require running repetitive multi-step actions (compress, watermark, sanitize, linearize) across dozens of files simultaneously, as well as capturing paper documents via camera.
- **Decision:**
  - Build a client-orchestrated Batch Queue modal that executes atomic pipelines over arbitrary lists of PDF documents with real-time per-file progress meters and auto-zip download.
  - Implement a mobile-first Scan modal leveraging `navigator.mediaDevices.getUserMedia` and platform camera abstractions with edge detection filters (B&W High Contrast, Grayscale, Color Document) and auto-conversion to PDF via `pdf-lib`.
- **Consequence:** Eliminates tedious manual repetition and seamlessly bridges paper document capture into digital PDF workflows.

---

## DECISION-019: Pluggable Provider-Agnostic LLM Interface with Offline Demo Mode
- **Status:** Accepted
- **Context:** Modern PDF workflows require intelligent document interaction (Q&A, executive summaries, bulleted insights, action item extraction, entity/PII detection). However, sending user documents to external AI providers without consent violates privacy requirements, and network connectivity may be unavailable.
- **Decision:**
  - Implement a unified client-side AI interface (`apps/web/src/features/ai/`) supporting OpenAI, Anthropic Claude, Google Gemini, and local private Ollama instances (`http://localhost:11434`).
  - Provide a built-in zero-network **Demo/Offline Mode** featuring intelligent heuristic extraction: rule-based summary generation, regex-powered entity detection (dates, monetary amounts, emails, phone numbers, SSNs, credit card numbers), and context-aware responses.
  - Store API keys strictly in client-side storage with an explicit toggle to disable AI globally.
- **Consequence:** Uncompromising privacy and guaranteed 100% offline functionality, while giving users frictionless access to cutting-edge cloud LLMs when desired.
