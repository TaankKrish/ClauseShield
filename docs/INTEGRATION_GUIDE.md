# ClauseShield: Module Integration Guide & Assembly Pipeline

> **Custodian**: Krish (Technical Lead & Integration Manager)  
> **Objective**: Sequence the seamless convergence of four parallel development streams into an end-to-end operational pipeline.

---

## 1. End-to-End Orchestration Sequence

The central coordinator of the application pipeline is `src/services/analysis-orchestrator.js`.  
Modules are connected in the following strict linear phase order:

```
[Phase 1: Ingestion]  ──►  [Phase 2: Privacy Shield]  ──►  [Phase 3: Segmentation]
                                                                    │
                                                                    ▼
[Phase 6: Audio & UI] ◄──  [Phase 5: Gemini GenAI]   ◄──  [Phase 4: Rule Engine]
```

---

## 2. Step-by-Step Connection Milestones

### Phase 1: Document Extraction Integration
- **Owner**: Mayank
- **Modules**: `src/modules/document-processing/pdf-extractor.js`, `ocr-extractor.js`
- **Hook Point**: `orchestrator.extractDocument(file, options)`
- **Input**: `File` object (PDF, PNG, JPG).
- **Output**: `DocumentExtractionResult` conformant to `docs/MODULE_CONTRACTS.md`.
- **Validation Check**: Verify text extraction on both native digital PDFs and scanned image samples from `public/demo-samples/`.

---

### Phase 2: Client-Side Privacy Sanitization Integration
- **Owner**: Mayank
- **Modules**: `src/modules/privacy/pii-sanitizer.js`
- **Hook Point**: `orchestrator.sanitizeText(rawText)`
- **Input**: Raw text from Phase 1.
- **Output**: `PrivacySanitizationResult` with anonymized tokens (`[REDACTED_AADHAAR]`, `[REDACTED_NAME]`) and local audit table.
- **Integration Invariant**: Phase 3 and Phase 4 must receive *only* sanitized text. The unredacted version is stored in client memory solely for UI diff comparison.

---

### Phase 3: Clause Segmentation Integration
- **Owner**: Mayank
- **Modules**: `src/modules/clause-segmentation/clause-segmenter.js`
- **Hook Point**: `orchestrator.segmentClauses(sanitizedText, originalText)`
- **Input**: Sanitized text string.
- **Output**: Array of segmented clause objects: `{ id, clauseNumber, sanitizedText, originalText }`.

---

### Phase 4: Deterministic Rule Engine Assessment Integration
- **Owner**: Mayank
- **Modules**: `src/modules/rule-engine/rule-evaluator.js`, `src/data/legal-rules/`
- **Hook Point**: `orchestrator.evaluateRules(clauses, contractType)`
- **Input**: Segmented clause array and contract category (`rental`, `coaching`, `employment`).
- **Output**: `RuleEngineAssessmentResult` containing risk flags (`RED`, `YELLOW`, `GREEN`, `UNASSESSED`), statutory citations, and caveat notes.
- **Integration Invariant**: All risk ratings are locked here. Gemini has zero write access to these ratings.

---

### Phase 5: Google Gemini AI Explanations Integration
- **Owner**: Pratyush
- **Modules**: `server/routes/gemini.js`, `src/services/gemini-service.js`, `src/modules/intelligence/`
- **Hook Point**: `orchestrator.generateExplanations(evaluatedClauses)`
- **Input**: Evaluated clauses with risk classifications (only RED, YELLOW, and key clauses are batched to optimize latency and token quota).
- **Output**: `GeminiExplanationResponse` with plain-language summaries, lawyer questions, and next steps.
- **Fallback**: If offline or server returns 500/timeout, orchestrator falls back to static template explanations in `src/data/legal-rules/offline-fallbacks.json`.

---

### Phase 6: Timeline Extraction & UI Assembly
- **Owner**: Nakashtra & Krish
- **Modules**: `src/modules/timeline/timeline-extractor.js`, `src/modules/speech/speech-synthesizer.js`, `src/components/dashboard/`
- **Hook Point**: `orchestrator.buildTimeline(evaluatedClauses)`
- **Output**: Rendered interactive dashboard:
  - Metric summary cards (Total clauses, Red flags, Yellow warnings).
  - Clause inspector with color-coded risk badges.
  - Actionable chronological timeline.
  - Bilingual audio player ("Play Briefing" in English or Hindi).

---

## 3. Integration Smoke Test Checklist

Before merging feature branches into `main`:
1. [ ] Can upload a rental agreement PDF and view extracted clauses in under 3 seconds.
2. [ ] PII sanitizer replaces all test Aadhaar, phone, and name tokens.
3. [ ] A unilateral forfeiture clause triggers `RED` risk with Section 74 citation.
4. [ ] An unrecognized clause triggers `UNASSESSED` (never `GREEN`).
5. [ ] Disconnecting internet still allows full rule engine evaluation and offline mock explanations.
6. [ ] Clicking "Listen in Hindi" initiates Hindi speech synthesis.

