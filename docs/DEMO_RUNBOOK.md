# ClauseShield: Two-Minute Hackathon Demo Runbook

> **Event**: Hackathon Presentation  
> **Speaker Roles**: Team Script Squad (Krish - Presenter, Nakashtra - UI Driver, Pratyush - AI Tech, Mayank - Rules & Privacy)  
> **Target Duration**: Exactly 120 Seconds (2:00)

---

## 1. Demo Narrative Arc & Timing

```
[0:00 - 0:25] The Problem & The Asymmetry of Power
[0:25 - 0:50] The Demo Document: Unfair Bengaluru Rental Agreement
[0:50 - 1:15] Client-Side Privacy Shield & Deterministic Rule Engine
[1:15 - 1:40] Gemini Plain-Language Insights & Lawyer Preparation Guide
[1:40 - 2:00] Timeline Checklist, Hindi Audio Briefing & Summary Pitch
```

---

## 2. Minute-by-Minute Script

### [0:00 - 0:25] Hook & Problem (Krish)
- **Visual**: ClauseShield Welcome Screen with clean Dark Navy & Emerald theme.
- **Script**:  
  *"Every month, hundreds of thousands of Indian citizens sign agreements they don't understand—rental leases with unilateral deposit confiscation, student coaching bonds with zero-refund traps, and restrictive employment covenants. Legal language is weaponized against ordinary people. We built **ClauseShield**: a local-first legal inspector with a single founding philosophy: **AI explains. Rules decide. The citizen stays protected.**"*

### [0:25 - 0:50] Ingestion & Privacy Shield (Nakashtra & Mayank)
- **Action**: Nakashtra clicks "Load Sample Rental Agreement" (or drops a PDF).
- **Visual**: Instant visual feedback showing text extraction and real-time PII redaction.
- **Script**:  
  *"Watch what happens when we load this standard 11-month rental contract. Right inside the browser—before anything hits any network—our Client-Side Privacy Shield detects and redacts the citizen's Aadhaar number, phone, and name. Notice: raw citizen data never leaves the device."*

### [0:50 - 1:15] The Deterministic Rule Engine (Mayank & Krish)
- **Visual**: Clause breakdown appears with color badges: 2 RED, 1 YELLOW, 1 GREEN, 2 UNASSESSED.
- **Action**: Hover over the RED badge on Clause 4 ("Security Deposit Forfeiture").
- **Script**:  
  *"Now look at Clause 4: 'The entire Rs 1,50,000 security deposit shall be unconditionally forfeited if tenant vacates before 11 months.' Our deterministic statutory engine immediately flags this in RED under Section 74 of the Indian Contract Act. Note this vital distinction: Gemini did not guess this risk level. A deterministic statutory rule decided it."*

### [1:15 - 1:40] Gemini Plain-Language Intelligence (Pratyush)
- **Action**: Click "Inspect Clause with Gemini". Modal opens with plain explanation, simple summary, and lawyer questions.
- **Script**:  
  *"Here is where Google Gemini excels. Instead of generating risky legal determinations, Gemini translates the clause into conversational plain English: 'If you leave early, the owner takes all your money even if they incur no loss.' Even better, it generates exact questions to ask a certified lawyer, and ready-to-use negotiation bullet points for the tenant."*

### [1:40 - 2:00] Timeline, Accessibility & Conclusion (Nakashtra & Krish)
- **Action**: Nakashtra toggles "Actionable Timeline" showing notice deadlines, then clicks the audio briefing button ("सुनिए हिंदी में").
- **Audio**: Brief browser voice speaks: *"खंड 4: सुरक्षा जमा ज़ब्ती का नियम अत्यधिक जोखिम भरा है..."*
- **Script**:  
  *"ClauseShield automatically extracts every notice period and payment deadline into an actionable checklist, and provides instant voice briefings in Hindi and English for accessible justice. ClauseShield turns ordinary citizens from vulnerable signatories into informed, empowered citizens. Thank you."*

---

## 3. Fallback & Backup Measures
- If the venue WiFi is slow or offline: The application runs with 100% offline rule evaluation and pre-cached Gemini explanation fallbacks.
- Sample documents are pre-bundled in `public/demo-samples/sample-rental-agreement.json`.
- A 1-click sample loader button is embedded on the welcome screen for zero-latency demo presentation.

