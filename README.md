# ClauseShield 🛡️

> **"AI explains. Rules decide. The citizen stays protected."**

ClauseShield is a local-first, AI-assisted legal document inspection platform designed to protect ordinary citizens from unfair, one-sided, or legally void contractual clauses in rental leases, student coaching bonds, and employment agreements.

Built by **Team Script Squad** (Krish, Pratyush, Mayank, Nakashtra).

---

## ⚡ Key Highlights

- 🔒 **Client-Side Privacy Shield**: All citizen documents and personal identifiers (Aadhaar, PAN, phone, names) are extracted and redacted locally inside the browser. Raw personal data is never transmitted to cloud APIs.
- ⚖️ **Deterministic Statutory Rule Engine**: Risk classifications (🔴 RED, 🟡 YELLOW, 🟢 GREEN, ⚪ UNASSESSED) are strictly evaluated against codified statutory rules (Indian Contract Act, Model Tenancy Act). AI is prohibited from deciding legal risk.
- 🤖 **Google Gemini Explanations**: Generates plain-language clause explanations, real-world implications, actionable negotiation points, and targeted questions for advocate consultations.
- ⏱️ **Actionable Timeline & Checklist**: Extracts notice periods, deposit refund windows, and escalation dates into an interactive checklist.
- 🗣️ **Dual-Language Accessibility**: Browser-native Web Speech audio briefings in English and Hindi.
- 🔌 **100% Offline Resilience**: Core document analysis and rule checks work entirely offline.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0 or later, v20+ recommended)
- npm (v9+ or v10+)

### 1. Installation
```bash
npm install
```

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```
Add your optional Google Gemini API key in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is provided, ClauseShield automatically falls back to deterministic offline explanations for smooth testing and demonstration!)*

### 3. Run Development Server
```bash
# Start frontend client (Vite)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To run the backend server (optional for full Gemini API proxy):
```bash
npm run server
```

---

## 🧪 Testing & Verification

```bash
# Run unit and integration test suite
npm run test

# Run ESLint code quality checks
npm run lint

# Build optimized production bundle
npm run build
```

---

## 📂 Architecture & Documentation

- [GEMINI.md](GEMINI.md) — Antigravity Agent & AI Developer Protocols
- [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) — Product vision, user personas, and problem statement
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture, pipeline, and security boundaries
- [docs/MODULE_CONTRACTS.md](docs/MODULE_CONTRACTS.md) — Standardized JSON input/output schemas
- [docs/DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md) — Engineering standards and coding conventions
- [docs/TEAM_ASSIGNMENTS.md](docs/TEAM_ASSIGNMENTS.md) — Team roles, file ownership, and Git workflows
- [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) — Phase-by-phase module assembly guide
- [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) — Unit, integration, privacy, and offline testing
- [docs/DEMO_RUNBOOK.md](docs/DEMO_RUNBOOK.md) — 2-minute hackathon demo script and execution flow

---

## ⚖️ Legal Disclaimer

ClauseShield is an educational, consultation-preparation tool and does not provide legal advice or legal representation. Always consult a certified legal advocate before signing any contract.

