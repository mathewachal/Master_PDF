# Master_PDF: Processing Boundaries & Known Limitations

Master_PDF follows a **Client-First, Privacy-Guaranteed Architecture**. All operations that can execute in the browser or mobile webview run 100% locally with zero server transmission. This document formally specifies the boundaries between purely client-side operations, local desktop sidecar tasks, and external backend services.

---

## 1. Feature Matrix & Processing Boundaries

| Category | Feature | Execution Engine | Offline Capable? | Network Required? |
|---|---|---|---|---|
| **View & Search** | High-DPI Rendering, Zoom, Rotate | `pdfjs-dist` Web Worker | Yes | No |
| **View & Search** | Full-Text Search & Bookmarks Outline | `pdfjs-dist` TextContent API | Yes | No |
| **Page Organize** | Merge, Split, Rotate, Delete, Insert | `pdf-lib` Client Memory | Yes | No |
| **Page Organize** | Reorder & Page Thumbnail Grid | `pdf-lib` + HTML5 DnD | Yes | No |
| **Images** | JPG/PNG to PDF, PDF to Images | `pdf-lib` + Canvas Export | Yes | No |
| **Optimize** | Client Compression & Rescaling | `pdf-lib` Object Re-encoding | Yes | No |
| **Annotate** | Vector Pen, Highlight, Shapes, Stamps | SVG Overlay Engine | Yes | No |
| **Annotate** | Flatten Annotations into PDF Stream | `pdf-lib` Vector Drawing | Yes | No |
| **Forms** | AcroForm Interactive Filling | `pdf-lib` AcroForm API | Yes | No |
| **E-Sign** | Freehand Signature Canvas & Placement | SVG + `pdf-lib` Embedded PNG | Yes | No |
| **Edit** | Custom Watermarks & Bates Numbering | `pdf-lib` Text Matrix Engine | Yes | No |
| **Edit** | Document Metadata & Info Editing | `pdf-lib` Info Dictionary | Yes | No |
| **Security** | AES-256 Encryption & Permission Flags | Backend (`pikepdf` / QPDF) | Yes (Sidecar) | Only if remote API |
| **Security** | True Byte-Level Certified Redaction | Backend (`PyMuPDF` Fitz Engine) | Yes (Sidecar) | Only if remote API |
| **Security** | PKCS#12 Digital Certificate Sign & Verify | Backend (`cryptography` X.509) | Yes (Sidecar) | Only if remote API |
| **Convert** | PDF to Word (`.docx`), Excel (`.xlsx`) | Backend (`pymupdf`, `python-docx`) | Yes (Sidecar) | Only if remote API |
| **Convert** | Markdown Conversion for LLMs | Backend (`pymupdf4llm`) | Yes (Sidecar) | Only if remote API |
| **Convert** | Table Extraction to Excel/CSV | Backend (`page.find_tables()`) | Yes (Sidecar) | Only if remote API |
| **OCR** | Multi-language Optical Character Recognition | Backend (`pytesseract` / Tesseract) | Yes (Sidecar) | Only if remote API |
| **Advanced** | Linearize (Fast Web View) & Repair | Backend (`pikepdf` QPDF Engine) | Yes (Sidecar) | Only if remote API |
| **Advanced** | Deep Privacy Sanitize (Strip metadata/JS) | Backend (`pikepdf` Object Walker) | Yes (Sidecar) | Only if remote API |
| **Advanced** | Side-by-Side Visual & Text Document Diff | Backend (`pymupdf` Pixmap Diff) | Yes (Sidecar) | Only if remote API |
| **A11y** | WCAG 2.1 & PDF/UA Accessibility Audit | Client Rule Engine | Yes | No |
| **Scan** | Camera Scan-to-PDF with Edge Filters | Browser MediaDevices / Capacitor | Yes | No |
| **AI** | Chat with PDF, Summaries, Entity Extraction | Pluggable (OpenAI, Anthropic, Gemini, Ollama, Demo) | Yes (Ollama / Demo) | Only if cloud LLM |

---

## 2. Technical Boundaries & Security Considerations

### 2.1 True Redaction vs Visual Blackout
- **Visual Black Box Danger:** Placing a black rectangle annotation over text in client-side PDF viewers leaves the underlying text stream, searchable strings, and vector glyphs intact. Malicious actors can select or extract the hidden text.
- **Master_PDF Guarantee:** Master_PDF separates visual highlight markup from true redaction. True redaction executes via PyMuPDF's certified sanitization engine (`apps/api/app/routers/redact.py`), which physically removes the underlying text glyphs, font subsets, image pixels, and vector path definitions from the PDF byte stream before recompressing.

### 2.2 Memory Boundaries in Browser Environments
- Browser Web Workers typically encounter memory allocation pressures when loading documents exceeding ~250MB or ~2,000 pages in 32-bit WebAssembly boundaries.
- **Mitigation:** The continuous scroll viewport uses lazy-rendering: only visible pages plus a 2-page buffer are held in canvas memory; offscreen canvas pixels are collected by the browser garbage collector.

### 2.3 Cryptographic Standards (PKCS#12 & X.509)
- Browser-based JavaScript lacks standardized, audited implementations for creating RFC 3161 compliant timestamped PKCS#7 / CADES signatures with SHA-256 byte-range hashes.
- Master_PDF delegates certified digital signatures to Python's OpenSSL-backed `cryptography` library (`apps/api/app/services/signing_service.py`), ensuring Adobe Acrobat reader compatibility and legal validity.

### 2.4 OCR Language Models
- OCR requires pre-installed Tesseract language packs (e.g., `eng`, `spa`, `fra`, `deu`, `hin`, `chi_sim`, `jpn`, `ara`).
- In desktop Electron packages, common language packs (`eng`, `spa`, `fra`, `deu`) are pre-bundled in the sidecar resource directory; specialized language packs can be downloaded on demand.

### 2.5 AI Privacy and Offline Guarantee
- When using the built-in **Offline Demo Mode** or local **Ollama** endpoint (`http://localhost:11434`), zero document text leaves the local machine.
- Cloud providers (OpenAI, Anthropic, Google Gemini) require the user to explicitly configure an API key in the AI Assistant settings. Keys are persisted exclusively in client-side local storage (`apps/web/src/features/ai/aiStore.ts`) and are never sent to the Master_PDF backend.
