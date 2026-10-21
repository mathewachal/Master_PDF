# Master_PDF

A premium, privacy-first, all-in-one PDF toolkit built with React 18, TypeScript, Tailwind CSS, and a high-performance Python FastAPI backend. Designed for seamless portability to Desktop (**Electron**) and Mobile (**Capacitor**).

---

## 🌟 Architectural Highlights

- **100% Client-First Privacy:** Core viewing, organizing, annotating, form filling, e-signing, and client compression execute strictly inside your local browser or app runtime using Web Workers and `pdf-lib` without sending a single byte over the wire.
- **Enterprise Server & Sidecar Power:** Heavy computation (multi-language OCR, certified byte-level redaction, Word/Excel conversions, table extraction, PKCS#12 digital signatures, damaged PDF repair, and visual document diffing) run in a high-performance Python FastAPI engine (`PyMuPDF`, `pikepdf`, `cryptography`, `openpyxl`, `python-docx`).
- **Pluggable AI Document Intelligence:** Chat with PDFs, generate executive/bullet summaries, and extract structured entities and PII using OpenAI, Anthropic Claude, Google Gemini, local Ollama, or an **offline heuristic demo mode** with zero external network dependencies.
- **Cross-Platform Ready:** Integrated platform abstraction layer (`apps/web/src/platform/`) with dedicated packaging guides for Electron (desktop with bundled sidecar) and Capacitor (Android & iOS).
- **Pro Productivity UX:** Instant Command Palette (`Ctrl+K`), drag-and-drop page organizer, dark/light theme, thumbnail grid, and full-text document search.

---

## 🚀 Completed Phase Implementations

| Phase | Domain | Capabilities Delivered | Tests Passing |
|---|---|---|---|
| **Phase 0** | **Foundation** | Monorepo scaffold, Tailwind design system, Docker containerization, platform abstraction layer (`IPlatformService`), FastAPI async job engine | Verified |
| **Phase 1** | **Core MVP** | `pdfjs-dist` Web Worker engine, page merge, split, rotate, delete, insert, reorder, client compression, JPG/PNG to PDF, AES-256 encryption & decryption | 10 frontend tests |
| **Phase 2** | **Annotate, Forms & E-Sign** | Vector pen, highlight, shapes, stamps, comments, PDF flattening, AcroForm filling & building, signature canvas & placement | 5 frontend tests |
| **Phase 3** | **Content Edit & Redact** | Watermarking, Bates numbering, page numbers, metadata editing, certified PyMuPDF true byte-level redaction | 7 frontend + 6 backend tests |
| **Phase 4** | **Convert & OCR** | PDF to Word (`.docx`), Excel (`.xlsx`), Markdown (`pymupdf4llm`), table extraction (`page.find_tables()`), multi-language OCR with auto-deskew | 5 frontend + 5 backend tests |
| **Phase 5** | **Advanced Suite** | PKCS#12 digital certificate signing & verification, linearization (Fast Web View), PDF repair, deep sanitization, document diffing, WCAG/PDF-UA a11y audit, camera scanner, multi-step batch automation | 6 frontend + 11 backend tests |
| **Phase 6** | **AI & Polish** | Chat with PDF, executive & bullet summaries, action item extraction, regex PII detector, OpenAI/Claude/Gemini/Ollama/Demo providers, packaging guides, full test verification | 5 frontend tests |

---

## 🛠️ Quick Start (under 5 commands)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Master_PDF.git
cd Master_PDF

# 2. Install Frontend & Backend Dependencies
npm install
cd apps/api && pip install -r requirements.txt && cd ../..

# 3. Start Frontend (React/Vite)
npm run dev

# 4. In a second terminal, start Backend (FastAPI)
npm run api:dev
```

- **Frontend Client:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000` (Interactive OpenAPI Swagger documentation at `http://localhost:8000/docs`)

---

## 🧪 Testing & Verification

Run the entire automated verification suite across frontend and backend:

```bash
# Frontend Unit & Integration Tests (43 tests passing)
cd apps/web && npm run test

# Frontend TypeScript Typecheck & Linting (0 errors)
npm run lint

# Frontend Production Build (7.3s, 0 errors)
npm run build

# Backend PyTest Suite (22 tests passing)
cd ../..
pytest apps/api/tests
```

---

## 📚 Technical Documentation

- 📋 [PROJECT_SPEC.md](file:///D:/Personal_Project/Master_PDF/PROJECT_SPEC.md) - Master Technical Specification
- 📐 [docs/ARCHITECTURE.md](file:///D:/Personal_Project/Master_PDF/docs/ARCHITECTURE.md) - Monorepo & Engine Architecture
- 🗺️ [docs/EXECUTION_PLAN.md](file:///D:/Personal_Project/Master_PDF/docs/EXECUTION_PLAN.md) - Phase-by-Phase Roadmap
- 💡 [docs/DECISIONS.md](file:///D:/Personal_Project/Master_PDF/docs/DECISIONS.md) - Architecture Decision Records (ADR 001 - 019)
- 📱 [docs/PORTING.md](file:///D:/Personal_Project/Master_PDF/docs/PORTING.md) - Electron Desktop & Capacitor Mobile Packaging Guide
- 🔒 [docs/KNOWN_LIMITATIONS.md](file:///D:/Personal_Project/Master_PDF/docs/KNOWN_LIMITATIONS.md) - Client vs Backend Processing Boundaries & Privacy Guarantees
