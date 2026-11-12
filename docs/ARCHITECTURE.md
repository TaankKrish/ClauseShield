# ClauseShield: System Architecture & Data Flow

> **Version**: 1.0.0  
> **Architecture Style**: Local-First Hybrid (Client-Side Intelligence + Secure Serverless GenAI)  
> **Key Principle**: *"AI explains. Rules decide. The citizen stays protected."*

---

## 1. High-Level Architectural Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER (Vite + React)                 │
│                                                                        │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │ Document Upload Layer   │         │ Privacy Sanitizer Engine     │  │
│  │ - PDF.js (Local render) │ ──────► │ - Regex PII scanner          │  │
│  │ - Tesseract.js (OCR)    │         │ - Aadhaar/PAN/Phone mask     │  │
│  │ - Canvas Image Preproc  │         │ - Local-only original cache  │  │
│  └─────────────────────────┘         └──────────────┬───────────────┘  │
│                                                     │                  │
│                                                     ▼                  │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │ Statutory Rule Engine   │         │ Clause Segmentation Engine   │  │
│  │ - Deterministic Library │ ◄────── │ - Numbering/Header parser    │  │
│  │ - RED/YELLOW/GREEN/     │         │ - Paragraph chunker          │  │
│  │   UNASSESSED evaluation │         │ - Redacted clause records    │  │
│  └────────────┬────────────┘         └──────────────────────────────┘  │
│               │                                                        │
│               ▼                                                        │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │ Timeline & Date Engine  │         │ Accessibility Engine         │  │
│  │ - Notice period regex   │         │ - Web Speech API (EN / HI)   │  │
│  │ - Penalty windows       │         │ - Dyslexia-friendly styling  │  │
│  │ - Action checklist      │         │ - Screen-reader ARIA live    │  │
│  └─────────────────────────┘         └──────────────────────────────┘  │
│               │                                                        │
│               │ Redacted Clauses Only (Over HTTPS)                     │
└───────────────┼────────────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER (Node.js / Express)              │
│                                                                        │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │ Security Gateway        │         │ Gemini GenAI Controller      │  │
│  │ - Rate Limiting         │ ──────► │ - System Prompt Guardrails   │  │
│  │ - PII Leak Detector     │         │ - JSON Schema Enforcement    │  │
│  │ - Request Validation    │         │ - @google/genai SDK          │  │
│  └─────────────────────────┘         └──────────────┬───────────────┘  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │   Google Gemini 2.5 API      │
                                       │   (Explanations, Qs, Guides) │
                                       └──────────────────────────────┘
```

---

## 2. Component Subsystems & Responsibilities

### 2.1 Ingestion & Extraction Layer (`src/modules/document-processing/`)
- Accepts PDF documents and image captures (JPEG, PNG).
- Invokes `pdfjs-dist` to extract structured text layer directly in the user's browser.
- Uses `tesseract.js` for OCR when the document is an image or flattened scan.
- Enforces max file size limits (15MB) and rejects malicious file formats.
- **Privacy Guarantee**: Document bytes never leave local memory.

### 2.2 Privacy & Sanitization Firewall (`src/modules/privacy/`)
- Intercepts all raw extracted text.
- Executes pattern matching against:
  - Indian Aadhaar numbers (`\b\d{4}\s\d{4}\s\d{4}\b`)
  - Permanent Account Numbers / PAN (`\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b`)
  - Indian 10-digit mobile phone numbers (`\b(\+91[\-\s]?)?[6-9]\d{9}\b`)
  - Email addresses
  - Bank Account Numbers and IFSC codes
  - Full personal names and residential addresses
- Replaces matches with anonymized placeholders (e.g. `[REDACTED_AADHAAR]`, `[REDACTED_NAME]`).
- Stores a mapping table locally in browser memory so the UI can highlight original text to the user while shielding remote calls.

### 2.3 Clause Segmentation Layer (`src/modules/clause-segmentation/`)
- Divides the sanitized full document text into individual atomic clauses.
- Uses regex heuristics for legal numbering formats: `1.`, `Section 2:`, `Clause (a)`, `Article IV`.
- Maintains sequential clause indices (`clause-001`, `clause-002`) and preserves layout context.

### 2.4 Deterministic Rule Engine (`src/modules/rule-engine/`)
- Operates over structured JSON rule catalogs (`src/data/legal-rules/`).
- Evaluates keywords, regex patterns, and logical conditions against each sanitized clause.
- Assigns one of four statutory risk ratings:
  - **RED**: Severe statutory breach or unfair term (e.g., blanket deposit forfeiture, complete non-compete).
  - **YELLOW**: Unbalanced or ambiguous clause requiring renegotiation.
  - **GREEN**: Balanced, statutory-compliant clause.
  - **UNASSESSED**: No matching statutory rule. Not flagged as safe!
- Associates statutory citations (`legalSource`) and legal caveats (`caveat`).
- **Core Rule**: Gemini cannot override, downgrade, or upgrade this classification.

### 2.5 Generative AI Layer (`server/services/gemini-service.js` & `src/modules/intelligence/`)
- Receives *only* sanitized clauses and their rule engine classifications.
- Prompting instructions strictly instruct Gemini to:
  - Provide a clear, jargon-free summary (max 3 sentences).
  - Explain *why* the rule engine flagged this clause.
  - Produce a practical list of 2–3 questions to ask a lawyer during consultation.
  - Produce suggested negotiation phrasing for the citizen.
- Returns structured JSON according to `MODULE_CONTRACTS.md`.

### 2.6 Timeline & Action Engine (`src/modules/timeline/`)
- Scans clauses for temporal commitments:
  - Notice periods (e.g., "1 month prior written notice")
  - Deposit refund windows (e.g., "within 15 days of handover")
  - Lock-in periods (e.g., "minimum lock-in of 6 months")
  - Rent escalation dates (e.g., "escalation of 10% after 11 months")
- Compiles a chronological action checklist for the citizen.

### 2.7 Accessibility & Speech Synthesis (`src/modules/speech/`)
- Uses browser-native `window.speechSynthesis`.
- Supports Hindi (`hi-IN`) and English (`en-IN` / `en-US`) voice briefings.
- Converts the document audit into an audio briefing for visually impaired or non-English literate citizens.

---

## 3. Security Boundary & Privacy Model

| Data Element | Stored On Client | Sent to Server | Sent to Gemini |
|---|---|---|---|
| Raw Document (PDF/Image) | In-Memory Only | ❌ NEVER | ❌ NEVER |
| Citizen Identifiers (PII) | In-Memory (Encrypted/Local) | ❌ NEVER | ❌ NEVER |
| Redacted Clause Text | ✅ Yes | ✅ Yes (Session) | ✅ Yes |
| Risk Rating (RED/YELLOW) | ✅ Yes | ✅ Yes | ✅ Yes (Context) |
| Gemini API Key | ❌ NEVER | ✅ Server Only | N/A |
