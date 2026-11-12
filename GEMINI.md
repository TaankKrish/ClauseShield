# GEMINI.md - ClauseShield Engineering & AI Agent Protocol

> **Target Audience**: All Antigravity AI agents and human engineers contributing to **ClauseShield**.  
> **Team**: Script Squad (Krish, Pratyush, Mayank, Nakashtra)  
> **Core Philosophy**: *"AI explains. Rules decide. The citizen stays protected."*

---

## 1. Product Overview & Purpose

**ClauseShield** is a local-first, AI-assisted legal document inspection platform designed for ordinary Indian citizens. It empowers users to analyze potentially exploitative or one-sided clauses in:
- Residential and commercial rental agreements
- Private coaching institute and educational student bonds
- Employment contracts and non-compete agreements
- Consumer terms of service and service agreements

### Critical Architectural Invariants
1. **The Deterministic Rule Engine is the Sole Authority on Risk**: Gemini is strictly prohibited from classifying legal risks or assigning RED/YELLOW/GREEN/UNASSESSED ratings. The rule engine owns classification.
2. **Unmatched Clauses are UNASSESSED**: A clause that does not trigger a deterministic rule is marked `UNASSESSED`, never automatically `GREEN`.
3. **Strict Client-Side Privacy Firewall**: Citizen documents, names, phone numbers, Aadhaar/PAN IDs, bank details, and personal addresses must **never** be sent to Google Gemini or external services. Only redacted, segmented clauses pass to AI explanation services.
4. **Informational & Legal Prep Tool Only**: ClauseShield does not practice law or act as an automated attorney. All outputs include disclaimers and questions for certified legal advocates.
5. **Zero Legal Hallucination**: No invented statutes, court decisions, or speculative legal citations.

---

## 2. System Architecture & Processing Pipeline

```
[ Citizen Document (PDF / Image) ]
              │
              ▼  (Client-Side: PDF.js / Tesseract.js)
     [ Text Extraction ]
              │
              ▼  (Client-Side Regex / Heuristics)
  [ Privacy Sanitizer (PII Redaction) ] ───────► Original Text Stored Locally Only
              │
              ▼
    [ Clause Segmenter ]
              │
              ▼  (Deterministic JSON Rule Library)
   [ Statutory Rule Engine ] ───────────────────► Risk: RED / YELLOW / GREEN / UNASSESSED
              │
              ▼  (Only Redacted Clauses Sent to Backend / Gemini)
   [ AI Explainer (Gemini API) ] ───────────────► Plain-language briefings, Qs for lawyers
              │
              ▼  (Regex & Heuristic Date Engine)
    [ Timeline Extractor ] ─────────────────────► Actionable Deadlines & Checklists
              │
              ▼  (Browser Web Speech API)
   [ Voice Briefing (EN / HI) ]
```

---

## 3. Technology Stack

- **Frontend Core**: React 19, Vite 6, JavaScript (ES Modules)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React icons
- **Document Processing**: `pdfjs-dist` (local PDF parsing), `tesseract.js` (local OCR for scanned images), HTML5 Canvas
- **Sanitization & Privacy**: Client-side regex engine (`src/modules/privacy/`)
- **Legal Intelligence**: Deterministic JSON-driven rule engine (`src/modules/rule-engine/`, `src/data/legal-rules/`)
- **Generative AI**: Official Google Gen AI SDK (`@google/genai`) wrapped in secure Node.js Express server (`server/`)
- **Accessibility**: Browser-native Web Speech API (`SpeechSynthesis`) with English and Hindi voice synthesis
- **Testing**: Vitest, React Testing Library, jsdom
- **Deployment**: Vercel frontend + serverless API endpoints

---

## 4. Module Ownership & Team Assignments

To prevent cross-file collision and conflicting edits during hackathon sprints, code ownership is partitioned as follows:

| Member | Primary Role | Owned Directories & Files |
|---|---|---|
| **Krish** | Tech Lead & Architect | `src/services/analysis-orchestrator.js`, `src/services/api-client.js`, `src/constants/`, `server/`, `vite.config.js`, repo config, docs |
| **Pratyush** | Generative AI Lead | `src/modules/intelligence/`, `src/services/gemini-service.js`, `server/routes/gemini.js`, server-side prompt engineering |
| **Mayank** | Legal Rules & Doc Processing | `src/modules/document-processing/`, `src/modules/privacy/`, `src/modules/clause-segmentation/`, `src/modules/rule-engine/`, `src/data/legal-rules/` |
| **Nakashtra** | Frontend & UX Lead | `src/components/`, `src/app/`, `src/modules/timeline/`, `src/modules/speech/`, demo flows & styling |

---

## 5. Shared Interface Governance & Data Contracts

**MANDATORY**: No agent or team member may alter the input/output schema defined in `docs/MODULE_CONTRACTS.md` without an explicit RFC approval from Krish (Tech Lead).

### Standardized Schemas

1. **Document Extraction Contract**:
   ```javascript
   {
     documentId: "DOC-001",
     pages: [{ pageNumber: 1, text: "..." }],
     fullText: "...",
     extractionMethod: "pdfjs" | "tesseract",
     success: true,
     warnings: []
   }
   ```

2. **Privacy Sanitization Contract**:
   ```javascript
   {
     sanitizedText: "...",
     redactions: [{ original: "...", replacement: "[REDACTED_AADHAAR]", type: "aadhaar" }],
     piiCheckPassed: true
   }
   ```

3. **Rule Engine Assessment Contract**:
   ```javascript
   {
     clauses: [
       {
         id: "clause-1",
         originalText: "...", // Kept strictly local
         sanitizedText: "...",
         riskLevel: "RED" | "YELLOW" | "GREEN" | "UNASSESSED",
         ruleId: "RULE-RENT-001",
         reason: "Unilateral forfeiture of security deposit without dispute mechanism.",
         legalSource: "Model Tenancy Act / Indian Contract Act Sec 74",
         caveat: "Check state-specific rent control modifications."
       }
     ],
     summary: { red: 0, yellow: 0, green: 0, unassessed: 0 }
   }
   ```

4. **Gemini AI Explanation Contract**:
   ```javascript
   {
     plainLanguageExplanation: "...",
     simpleSummary: "...",
     questionsForLawyer: ["..."],
     suggestedNextSteps: ["..."],
     language: "en" | "hi"
   }
   ```

5. **Timeline Contract**:
   ```javascript
   {
     items: [
       {
         id: "time-1",
         title: "Security Deposit Refund Window",
         dateText: "Within 30 days of vacation",
         clauseId: "clause-2",
         urgency: "HIGH" | "MEDIUM" | "LOW"
       }
     ]
   }
   ```

---

## 6. Privacy & Legal Security Rules

1. **Client-Side Sanitization Before API Dispatch**:
   Never call the Gemini API endpoint or server with raw extracted text. Always verify that `sanitizedText` was processed by `src/modules/privacy/pii-sanitizer.js`.
2. **Server-Side API Key Storage**:
   The `GEMINI_API_KEY` must only reside in backend environment variables (`.env`). It must never be exposed via `VITE_` prefixed client variables.
3. **No Storage of Citizen Documents**:
   Neither original files nor uploaded PDFs may be persisted to databases, disk, or remote buckets. Processing is transient in browser memory.
4. **Fallback & Mock Support**:
   When offline or running without a Gemini API key, the system must degrade gracefully to deterministic offline explanations using pre-compiled rule explanations.

---

## 7. Git & Development Workflow

- **Branch Naming**:
  - `feature/frontend` (Nakashtra)
  - `feature/document-processing` (Mayank)
  - `feature/rule-engine` (Mayank)
  - `feature/gemini-integration` (Pratyush)
  - `feature/integration` (Krish)
- **Commits**: Use conventional commits (e.g., `feat(privacy): add PAN number regex sanitization`, `fix(rule-engine): prevent false green classification`).
- **Pull Requests**: Every PR must fill the `.github/pull_request_template.md` and verify that `npm run lint`, `npm run test`, and `npm run build` all pass cleanly.

---

## 8. Verification and Quality Assurance Standards

Before any agent marks a task complete:
1. Run `npm run lint` and ensure **zero** ESLint warnings/errors.
2. Run `npm run test` and ensure all unit/integration tests pass.
3. Run `npm run build` and ensure the production bundle compiles without warnings.
4. Verify accessibility and responsive layout across mobile and desktop breakpoints.

