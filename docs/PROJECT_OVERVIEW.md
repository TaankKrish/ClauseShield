# ClauseShield: Project Overview

> **Product**: ClauseShield  
> **Tagline**: *"AI explains. Rules decide. The citizen stays protected."*  
> **Team**: Script Squad (Krish, Pratyush, Mayank, Nakashtra)  
> **Target Event**: Hackathon 2026

---

## 1. The Problem Statement

Every year, millions of Indian citizens sign contracts containing onerous, exploitative, or legally void clauses:
- **Tenants** sign rental agreements containing unilateral deposit forfeitures, arbitrary rent hikes, and unannounced landlord entry rights.
- **Students & Parents** sign coaching institute enrollment agreements forfeiting entire multi-year fee amounts with zero refund guarantees if classes are substandard.
- **Fresh Graduates & Employees** sign service bonds with unreasonable non-compete covenants or massive financial penalties for leaving before 2–3 years.
- **Consumers** accept digital terms of service agreeing to mandatory arbitration in distant jurisdictions.

### The Asymmetry of Power
Ordinary citizens do not retain attorneys for routine contracts. Legal jargon ("indemnify", "liquidated damages", "joint and several liability") is intentionally obscure. When disputes arise, citizens are often bullied into surrender by boilerplate clauses that are actually invalid under Indian law (e.g., Section 27 or 74 of the Indian Contract Act, 1872).

---

## 2. The ClauseShield Solution

ClauseShield is a **local-first, privacy-preserving, AI-assisted legal document inspection tool**. It acts as a shield between the citizen and unfair contracts before they sign.

Instead of an opaque, hallucination-prone "AI lawyer", ClauseShield uses a **dual-engine hybrid architecture**:
1. **A Deterministic Rule Engine**: Tests clauses against codified statutory rules (Indian Contract Act, Model Tenancy Act, Consumer Protection Act) to assign an indisputable risk rating:
   - 🔴 **RED (Critical Risk / Potentially Unenforceable)**: Violates statutory protection, imposes unilateral penalties, or strips basic rights.
   - 🟡 **YELLOW (Ambiguous / Cautionary)**: Vague terminology, unbalanced notice periods, or missing dispute mechanisms.
   - 🟢 **GREEN (Standard / Balanced)**: Fair standard terms adhering to legal best practices.
   - ⚪ **UNASSESSED**: Clauses that do not match existing statutory rules. They are never prematurely assumed safe.
2. **Google Gemini Generative AI**: Never decides risk; instead, translates the complex clause into **plain language**, outlines real-world implications, suggests **practical questions to ask a certified advocate**, and recommends actionable next steps.

---

## 3. Target User Personas

1. **Rohan (24, Tech Worker moving to Bengaluru)**:
   - *Scenario*: Landlord provides an 11-month agreement requiring 10 months security deposit, 20% annual hike, and no refund if vacating before 11 months.
   - *Value*: ClauseShield highlights the forfeiture clause in RED, cites statutory deposit norms, and gives Rohan bullet points to negotiate.
2. **Ananya (18, NEET Aspirant in Kota)**:
   - *Scenario*: Coaching institute requires full 2-year payment upfront with a "No Refund Under Any Circumstance" bond.
   - *Value*: Identifies Consumer Protection Act guidelines on fee refunds for unrendered educational services.
3. **Pooja (22, Junior Developer in Pune)**:
   - *Scenario*: First employment offer contains a 2-year non-compete forbidding work in the entire software industry.
   - *Value*: Flags Section 27 of the Indian Contract Act (agreements in restraint of trade are void) and equips her with questions for an employment lawyer.

---

## 4. Core Features & Capabilities

- **Multi-Format Ingestion**: Supports digital PDF agreements and mobile camera photos/scans (via client-side PDF.js and Tesseract.js OCR).
- **Client-Side Privacy Shield**: Automatically redacts citizen names, Aadhaar numbers, PAN numbers, bank accounts, emails, and phone numbers locally before any cloud communication.
- **Clause Segmentation**: Intelligently decomposes contracts into numbered, thematic clauses for granular evaluation.
- **Statutory Legal Rule Library**: Pre-seeded JSON rule definitions mapped to Indian statutes and established judicial doctrines.
- **Plain-Language Explanations**: Gemini 2.5 generates clear, jargon-free explanations, plain summaries, and lawyer consultation guides.
- **Actionable Timeline & Checklist**: Extracts critical notice periods, refund deadlines, lock-in expirations, and renewal dates into an interactive timeline.
- **Dual-Language Accessibility**: Browser-native voice briefings in both Hindi and English for accessibility across literacy levels.
- **Offline Resilience**: Full core audit and rule engine functionality remains operational without an internet connection.

---

## 5. MVP Scope & Hackathon Boundaries

### In-Scope (MVP)
- Rental agreements, student coaching contracts, and employment bonds.
- Client-side PDF text extraction and mock/OCR image fallback.
- Client-side regex PII redaction.
- Deterministic 4-level classification (RED, YELLOW, GREEN, UNASSESSED).
- Gemini API server integration with mock fallback for offline demo stability.
- Timeline deadline extraction.
- Web Speech voice synthesis (English & Hindi).
- Interactive, responsive, high-contrast dashboard.

### Out-of-Scope (Future Roadmap)
- Real-time legal consultation marketplace / lawyer referral network.
- Automated e-signing or digital contract drafting.
- Multi-jurisdiction support outside Indian statutory frameworks.
- Persistent user accounts, cloud databases, or document storage.
