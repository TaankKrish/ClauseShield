# ClauseShield: Standardized Module Contracts & Data Schemas

> **Status**: Approved Standard  
> **Custodian**: Krish (Tech Lead & Integration Manager)  
> **Notice**: Breaking changes to these interfaces require an RFC approved by the Tech Lead.

---

## 1. Document Extraction Contract

**Producer**: `src/modules/document-processing/pdf-extractor.js`, `ocr-extractor.js`  
**Consumer**: `src/modules/privacy/pii-sanitizer.js`, `src/services/analysis-orchestrator.js`

```typescript
interface ExtractedPage {
  pageNumber: number;
  text: string;
}

interface DocumentExtractionResult {
  documentId: string;           // Unique session document ID, e.g. "DOC-1700000000"
  pages: ExtractedPage[];       // Per-page text chunks
  fullText: string;             // Aggregated continuous document string
  extractionMethod: "pdfjs" | "tesseract" | "manual";
  success: boolean;             // True if extraction completed without fatal errors
  warnings: string[];           // Non-fatal extraction issues (e.g., low-resolution pages)
}
```

### JSON Example
```json
{
  "documentId": "DOC-001",
  "pages": [
    {
      "pageNumber": 1,
      "text": "RENTAL AGREEMENT This agreement made on 1st March 2026..."
    }
  ],
  "fullText": "RENTAL AGREEMENT This agreement made on 1st March 2026 between Landlord and Tenant...",
  "extractionMethod": "pdfjs",
  "success": true,
  "warnings": []
}
```

---

## 2. Privacy Sanitization Contract

**Producer**: `src/modules/privacy/pii-sanitizer.js`  
**Consumer**: `src/modules/clause-segmentation/segmenter.js`, `src/services/analysis-orchestrator.js`

```typescript
interface RedactionRecord {
  id: string;                   // "redact-1"
  type: "aadhaar" | "pan" | "phone" | "email" | "bank" | "name" | "address";
  original: string;             // The sensitive token (kept strictly local)
  replacement: string;          // Placeholder token, e.g. "[REDACTED_AADHAAR_1]"
  index: number;                // Character position in raw string
}

interface PrivacySanitizationResult {
  sanitizedText: string;        // Text with all sensitive tokens replaced
  redactions: RedactionRecord[]; // Audit list of performed redactions
  piiCheckPassed: boolean;      // True if scanner confirms no residual raw PII detected
}
```

### JSON Example
```json
{
  "sanitizedText": "Agreement entered between [REDACTED_NAME_1] residing at [REDACTED_ADDRESS_1] with Aadhaar [REDACTED_AADHAAR_1] and Tenant [REDACTED_NAME_2]...",
  "redactions": [
    {
      "id": "redact-1",
      "type": "aadhaar",
      "original": "4521 8832 9912",
      "replacement": "[REDACTED_AADHAAR_1]",
      "index": 72
    }
  ],
  "piiCheckPassed": true
}
```

---

## 3. Clause Segmentation & Rule Engine Assessment Contract

**Producer**: `src/modules/rule-engine/rule-evaluator.js`  
**Consumer**: `src/services/analysis-orchestrator.js`, UI Dashboard components

```typescript
type RiskLevel = "RED" | "YELLOW" | "GREEN" | "UNASSESSED";

interface EvaluatedClause {
  id: string;                   // Sequential clause ID: "clause-1", "clause-2"
  clauseNumber?: string;        // In-text clause reference, e.g. "Clause 4.2"
  originalText: string;         // Kept strictly on the client
  sanitizedText: string;        // Safe text passed to backend / AI
  riskLevel: RiskLevel;         // Deterministic rule assessment
  ruleId: string | null;        // Matched rule identifier, e.g. "RULE-RENT-001"
  reason: string;               // Plain language statutory explanation for flag
  legalSource: string;          // Statutory section, e.g. "Indian Contract Act, 1872 - Sec 74"
  caveat: string;               // Nuances, state modifications, or consultation note
}

interface RuleEngineSummary {
  red: number;
  yellow: number;
  green: number;
  unassessed: number;
  total: number;
}

interface RuleEngineAssessmentResult {
  clauses: EvaluatedClause[];
  summary: RuleEngineSummary;
}
```

### JSON Example
```json
{
  "clauses": [
    {
      "id": "clause-1",
      "clauseNumber": "Section 4(b)",
      "originalText": "The entire security deposit of Rs 1,00,000 shall be forfeited without notice if tenant leaves before 11 months.",
      "sanitizedText": "The entire security deposit of [REDACTED_AMOUNT] shall be forfeited without notice if tenant leaves before 11 months.",
      "riskLevel": "RED",
      "ruleId": "RULE-RENT-001",
      "reason": "Unilateral total forfeiture of security deposit without genuine pre-estimate of damages is treated as an unlawful penalty clause.",
      "legalSource": "Indian Contract Act, 1872 - Section 74 (Compensation for breach of contract where penalty stipulated for)",
      "caveat": "Landlord is entitled to actual rent arrears or verified property damage, but not arbitrary punitive forfeiture."
    }
  ],
  "summary": {
    "red": 1,
    "yellow": 0,
    "green": 0,
    "unassessed": 0,
    "total": 1
  }
}
```

---

## 4. Gemini AI Explanation Contract

**Producer**: `server/routes/gemini.js` / `src/services/gemini-service.js`  
**Consumer**: `src/components/clauses/ClauseDetailModal.jsx`, `src/components/dashboard/`

```typescript
interface GeminiExplanationResponse {
  plainLanguageExplanation: string; // Jargon-free breakdown of what this clause means in practice
  simpleSummary: string;             // 1-2 sentence high-level summary
  questionsForLawyer: string[];      // 2-3 specific questions for an advocate consultation
  suggestedNextSteps: string[];      // Practical negotiation advice or actions
  language: "en" | "hi";
}
```

### JSON Example
```json
{
  "plainLanguageExplanation": "This clause allows the property owner to keep all your deposit money if you move out early, even if you found a replacement tenant or gave ample notice.",
  "simpleSummary": "You risk losing 100% of your deposit if you vacate before 11 months, regardless of actual damages.",
  "questionsForLawyer": [
    "Is this forfeiture clause enforceable under local tenancy law in Karnataka?",
    "Can we amend this to require deduction only for proven unpaid rent or physical damages?"
  ],
  "suggestedNextSteps": [
    "Negotiate a standard 1-month notice period exit clause instead of complete deposit forfeiture.",
    "Request mutual early-termination terms for sudden job relocation."
  ],
  "language": "en"
}
```

---

## 5. Timeline & Action Checklist Contract

**Producer**: `src/modules/timeline/timeline-extractor.js`  
**Consumer**: `src/components/timeline/TimelineView.jsx`

```typescript
type UrgencyLevel = "HIGH" | "MEDIUM" | "LOW";

interface TimelineItem {
  id: string;                   // "time-1"
  title: string;                // "Notice to Vacate Requirement"
  dateText: string;             // "30 days prior written notice"
  clauseId: string;             // Reference to triggering clause
  urgency: UrgencyLevel;
  actionRequired: string;       // "Draft and deliver written vacation letter"
}

interface TimelineResult {
  items: TimelineItem[];
}
```

### JSON Example
```json
{
  "items": [
    {
      "id": "time-1",
      "title": "Notice Period Before Vacation",
      "dateText": "1 month prior to intended exit date",
      "clauseId": "clause-5",
      "urgency": "HIGH",
      "actionRequired": "Serve written notice via registered email to avoid forfeiture."
    },
    {
      "id": "time-2",
      "title": "Deposit Refund Window",
      "dateText": "Within 15 days of key handover",
      "clauseId": "clause-8",
      "urgency": "MEDIUM",
      "actionRequired": "Conduct joint inspection on key handover day and record meter readings."
    }
  ]
}
```

