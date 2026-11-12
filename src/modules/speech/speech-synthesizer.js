/**
 * Browser-Native Web Speech Synthesis Wrapper
 * Provides accessibility voice briefings in English and Hindi.
 */

class SpeechSynthesizer {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.synth = this.isSupported ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isSpeaking = false;
  }

  /**
   * Speaks the given text in English or Hindi.
   *
   * @param {string} text - The briefing text to speak
   * @param {'en'|'hi'} [language='en'] - Target language
   * @param {object} [callbacks] - onStart, onEnd, onError callbacks
   */
  speak(text, language = 'en', callbacks = {}) {
    if (!this.isSupported || !this.synth) {
      if (callbacks.onError) callbacks.onError(new Error('Web Speech API is not supported in this browser.'));
      return;
    }

    // Cancel any active speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (callbacks.onError) callbacks.onError(event);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  /**
   * Compiles an executive spoken briefing string from evaluated clauses.
   *
   * @param {Array<object>} clauses
   * @param {'en'|'hi'} language
   * @returns {string}
   */
  generateBriefingScript(clauses, language = 'en') {
    const redClauses = clauses.filter((c) => c.riskLevel === 'RED');

    if (language === 'hi') {
      if (redClauses.length === 0) {
        return 'क्लॉज़-शील्ड विश्लेषण पूरा हुआ। इस अनुबंध में कोई गंभीर वैधानिक उल्लंघन नहीं पाया गया। कृपया सामान्य सावधानी बरतें।';
      }
      return `क्लॉज़-शील्ड सुरक्षा चेतावनी। इस दस्तावेज़ में ${redClauses.length} अत्यधिक जोखिम भरे नियम पाए गए हैं। उदाहरण के लिए, ${redClauses[0].reason}। हस्ताक्षर करने से पहले कानूनी विशेषज्ञ से परामर्श लें।`;
    }

    // English
    if (redClauses.length === 0) {
      return 'ClauseShield audit complete. No critical statutory violations were detected in this agreement. Standard diligence recommended.';
    }
    return `ClauseShield security alert. We detected ${redClauses.length} critical risk clauses in this document. Most notably: ${redClauses[0].reason}. Please consult a licensed legal advocate prior to signing.`;
  }
}

export const speechService = new SpeechSynthesizer();
