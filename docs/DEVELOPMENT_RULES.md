# ClauseShield: Development Rules & Engineering Standards

> **Status**: Mandatory Standard  
> **Applicability**: All Contributors, Agents, and Subagents  
> **Philosophy**: Clean, safe, testable code for ordinary citizens.

---

## 1. Golden Rules of ClauseShield Engineering

1. **Deterministic Rule Engine Supremacy**:
   Under no circumstances shall Google Gemini or any LLM be used to generate or modify risk classification ratings (`RED`, `YELLOW`, `GREEN`, `UNASSESSED`). Legal determinations belong exclusively to codified statutory rules in `src/modules/rule-engine/` and `src/data/legal-rules/`.

2. **Zero-PII Transmission Firewall**:
   All citizen documents, raw scanned text, personal names, phone numbers, Aadhaar numbers, PAN cards, email addresses, and home addresses must be sanitized client-side before any outbound API call to Gemini or backend servers.
   - Test every payload against `src/modules/privacy/pii-sanitizer.js`.
   - Never log unredacted text in console logs or error reports.

3. **No Unmatched Clause Assumed Safe**:
   If a contractual clause does not trigger a deterministic rule, its risk level is `UNASSESSED`. Never default unassessed clauses to `GREEN` (Safe).

4. **Zero Legal Hallucination**:
   Never invent case citations, fictitious act sections, or pretend to provide binding legal counsel. Always include the disclaimer:
   > *"ClauseShield is an educational, consultation-preparation tool and does not provide legal advice. Always consult a licensed legal advocate before signing."*

---

## 2. Code Organization & File Ownership

### Directory Structure & Boundaries
```
src/
├── app/                  # Application root, Context providers (Auth/Session)
├── components/           # UI components grouped by feature domain
│   ├── common/           # Reusable UI primitives (Button, Card, Badge, Modal)
│   ├── layout/           # AppHeader, Footer, Navigation, Container
│   ├── upload/           # File dropzone, camera upload, progress bars
│   ├── dashboard/        # Executive scorecards, metric pills, summary views
│   ├── clauses/          # Clause card, risk indicator, comparison diff
│   ├── timeline/         # Chronological milestones, deadline warnings
│   └── accessibility/    # Audio player, font-scaler, bilingual toggle
├── modules/              # Pure domain logic (independent of React UI)
│   ├── document-processing/ # PDF.js and Tesseract.js text extraction
│   ├── privacy/          # Regex PII detection, redaction, and reversibility
│   ├── clause-segmentation/ # Heading & paragraph decomposition
│   ├── rule-engine/      # Deterministic statutory matcher
│   ├── intelligence/     # Gemini prompt orchestrator and response parser
│   ├── timeline/         # Temporal expressions & deadline compiler
│   └── speech/           # Web Speech API speech synthesis wrapper
├── services/             # Orchestrators and external client facades
├── data/                 # Codified JSON rules, static reference mappings
├── hooks/                # Custom React hooks (useAudioBriefing, useAnalysis)
├── utils/                # General helpers (formatters, date utils, text sanitizers)
├── constants/            # Risk levels, legal categories, default config
└── styles/               # Global CSS & Tailwind imports
```

### Module Boundary Invariants
- Code in `modules/` must be pure JavaScript without JSX or React hooks. This makes all domain logic 100% testable in headless unit test runners (Vitest).
- React components in `components/` should consume domain logic via custom hooks or services, never implementing raw regex parsing or PDF rendering inline.

---

## 3. JavaScript & React Coding Conventions

1. **Modern ES Modules**: Use `import` / `export`. Avoid CommonJS `require()` in frontend source.
2. **Explicit Prop Validation & Destructuring**: Destructure props cleanly with sensible defaults.
3. **No Magic Strings or Numbers**:
   - Use constants from `src/constants/risk-levels.js` (`RISK_LEVELS.RED`, `RISK_LEVELS.YELLOW`, etc.).
   - Use error codes from `src/constants/error-codes.js`.
4. **Tailwind CSS v4 Styling**:
   - Use utility classes directly in `className`.
   - Brand color palette:
     - Dark Navy: `slate-900` / `navy-900` (`#0f172a`)
     - Clean White/Light: `slate-50` / `white` (`#f8fafc`)
     - Emerald Green: `emerald-500` / `emerald-600` (`#10b981`)
     - Risk Red: `red-600` (`#dc2626`)
     - Caution Yellow: `amber-500` (`#f59e0b`)

---

## 4. Error Handling & Offline Fallback Strategy

1. **Graceful Degradation**:
   - If PDF.js fails to parse a corrupt PDF, alert the user with actionable instructions and suggest photo/OCR mode.
   - If Gemini API is unreachable or rate-limited, fall back seamlessly to local rule-based explanations stored in `src/data/legal-rules/`.
   - If Web Speech API is not supported by the browser, disable the voice button gracefully with a tooltip.
2. **Never Throw Uncaught Exceptions in Async Streams**:
   All asynchronous operations must be wrapped in `try/catch` and return standardized `{ success, data, error }` envelopes.

---

## 5. Security & Dependency Guidelines

1. **No Backend Database Dependencies**: ClauseShield is stateless by design. Citizen data resides in browser memory and is discarded on tab closure.
2. **Dependency Hygiene**: Do not introduce heavy dependencies or random npm packages without consulting Krish.
3. **Strict Content Sanitization**: When rendering clause HTML or text, ensure text is rendered safely via React's default text escaping to prevent XSS.
