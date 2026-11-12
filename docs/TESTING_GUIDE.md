# ClauseShield: Comprehensive Testing Guide

> **Testing Framework**: Vitest + React Testing Library + jsdom  
> **Coverage Scope**: Unit testing, Integration testing, Privacy leak tests, and Offline resilience testing.

---

## 1. Running Tests

```bash
# Run full test suite once
npm run test

# Run tests in interactive watch mode during development
npm run test:watch

# Run code style and syntax verification
npm run lint

# Verify production compilation
npm run build
```

---

## 2. Test Architecture

The test directory structure mirrors the domain model:
```
tests/
├── fixtures/                    # Mock contract texts and sanitized fixtures
│   ├── sample-rental-contract.json
│   ├── sample-coaching-bond.json
│   └── pii-test-corpus.json
├── unit/                        # Isolated module testing
│   ├── privacy-sanitizer.test.js
│   ├── rule-engine.test.js
│   ├── clause-segmenter.test.js
│   ├── gemini-service.test.js
│   └── timeline-extractor.test.js
└── integration/                 # End-to-end orchestrator flows
    ├── orchestrator.test.js
    └── offline-fallback.test.js
```

---

## 3. Dedicated Testing Categories

### 3.1 Unit Testing: Privacy & PII Sanitizer
The privacy sanitizer must undergo adversarial testing against synthetic PII datasets:
- **Aadhaar Regex**: 12-digit spaced and unspaced numbers (`1234 5678 9012`, `123456789012`).
- **PAN Regex**: 10-character alphanumeric uppercase codes (`ABCDE1234F`).
- **Phone Numbers**: 10-digit Indian mobiles with and without `+91`, spaces, and hyphens.
- **Emails & Addresses**: Standard RFC formats and Indian residential address patterns.
- **Reversibility Check**: Ensure the client mapping table accurately can replace anonymized tokens only within client view.

### 3.2 Unit Testing: Deterministic Rule Engine
- **Invariant Test**: Assert that a completely empty, neutral, or uncodified clause returns `riskLevel: "UNASSESSED"`, NEVER `"GREEN"`.
- **Statutory Citation Test**: Confirm that rules for Section 74 (Contract Act), Section 27 (Restraint of Trade), and Model Tenancy Act return accurate non-hallucinated citation strings.
- **Summary Consistency Test**: Sum of `red + yellow + green + unassessed` must always equal `total`.

### 3.3 Unit Testing: Gemini Service & Prompt Defense
- **Risk Override Test**: Verify that the Gemini service rejects any response trying to alter `riskLevel`.
- **JSON Schema Strictness**: Ensure API returns conformant JSON even if the model attempts to generate conversational preambles.
- **Mock Response Verification**: Ensure mock fallback activates when API keys are absent or invalid.

### 3.4 Integration Testing: Orchestrator Pipeline
- Tests the complete execution flow from raw text input through sanitization, segmentation, rule assessment, AI explanation, and timeline extraction.
- Asserts that original PII never leaks into the sanitized clause pipeline.

### 3.5 Offline Resilience Testing
- Disable network in tests to verify that the core rule engine, segmentation, and offline explanations execute successfully without throwing unhandled network exceptions.

