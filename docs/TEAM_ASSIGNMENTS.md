# ClauseShield: Team Roles, Ownership & Parallel Execution Plan

> **Team**: Script Squad  
> **Repository Strategy**: Modular ownership with clear contract-driven integration points.

---

## 1. Roster & Module Ownership Breakdown

### 👨‍💼 Krish — Technical Lead, Architect & Integration Manager
- **Core Responsibilities**:
  - Overall system architecture, repository hygiene, and dependency governance.
  - End-to-end analysis orchestration (`src/services/analysis-orchestrator.js`).
  - Secure backend architecture & API proxy (`server/index.js`, `server/routes/`).
  - Continuous integration, build verification, and Vercel deployment pipeline.
  - Pull request reviews, interface change gatekeeping (`docs/MODULE_CONTRACTS.md`).
- **Files Owned**:
  - `src/services/analysis-orchestrator.js`
  - `src/services/api-client.js`
  - `server/**`
  - `docs/**`
  - `package.json`, `vite.config.js`, `.env.example`, `.gitignore`

---

### 🧠 Pratyush — Generative AI Lead & Prompt Engineer
- **Core Responsibilities**:
  - Google Gemini API integration using `@google/genai`.
  - Server-side and client-side prompt engineering for plain-language clause explanations.
  - Legal disclaimer enforcement in AI outputs.
  - Generating citizen-focused questions for advocate consultations and practical negotiation steps.
  - Building offline / mock fallback responses to guarantee demo reliability.
- **Files Owned**:
  - `server/services/gemini-service.js`
  - `server/routes/gemini.js`
  - `src/modules/intelligence/**`
  - `src/services/gemini-service.js`
  - `tests/unit/gemini-service.test.js`

---

### ⚖️ Mayank — Document Processing, Privacy & Legal Rules Specialist
- **Core Responsibilities**:
  - Client-side document extraction via `pdfjs-dist` (PDFs) and `tesseract.js` (scanned photos).
  - Client-side Privacy & PII Sanitizer (Aadhaar, PAN, phone numbers, names, bank accounts).
  - Clause segmentation engine (identifying section numbering, clause breaks).
  - Codifying deterministic JSON legal rule catalogs for rental agreements, student bonds, and employment contracts.
  - Deterministic statutory rule evaluator (enforcing RED, YELLOW, GREEN, UNASSESSED ratings).
- **Files Owned**:
  - `src/modules/document-processing/**`
  - `src/modules/privacy/**`
  - `src/modules/clause-segmentation/**`
  - `src/modules/rule-engine/**`
  - `src/data/legal-rules/**`
  - `tests/unit/privacy-sanitizer.test.js`
  - `tests/unit/rule-engine.test.js`

---

### 🎨 Nakashtra — Frontend Architect, UX & Accessibility Lead
- **Core Responsibilities**:
  - Responsive, high-contrast, modern user interface with Tailwind CSS v4 and Lucide React.
  - Executive dashboard with summary scorecards (RED / YELLOW / GREEN / UNASSESSED badges).
  - Interactive clause inspector and side-by-side comparison view (original local text vs sanitized clause).
  - Actionable Timeline and deadline checklist component (`src/components/timeline/`).
  - Browser-native Web Speech audio briefing integration (English and Hindi).
  - Demo sample document selector and smooth presentation experience.
- **Files Owned**:
  - `src/app/**`
  - `src/components/**`
  - `src/modules/timeline/**`
  - `src/modules/speech/**`
  - `src/hooks/**`
  - `public/demo-samples/**`
  - `tests/unit/components.test.jsx`

---

## 2. Git Branching Strategy & Parallel Workflow

To allow four developers to work simultaneously without Git conflicts:

```
                  ┌── feature/document-processing ──┐
                  │    (Mayank: OCR, PDF, Rules)    │
                  │                                 │
main ─────────────┼── feature/gemini-integration ───┼───► main (v1.0.0 Release)
(Protected)       │    (Pratyush: GenAI & Prompts)  │
                  │                                 │
                  ├── feature/frontend ─────────────┤
                  │    (Nakashtra: Dashboard, UI)   │
                  │                                 │
                  └── feature/integration ──────────┘
                       (Krish: Orchestration & E2E)
```

### Branching Rules
1. Branch names must follow `feature/<stream-name>`.
2. Do not merge directly to `main` without opening a pull request.
3. Every PR must verify:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
4. If an interface update is required in `docs/MODULE_CONTRACTS.md`, Krish must be notified to approve the revision before branches diverge.

