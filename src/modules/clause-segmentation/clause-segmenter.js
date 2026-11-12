/**
 * Clause Segmentation Engine
 * Decomposes continuous legal text into numbered, discrete clause units.
 */

/**
 * Segments document text into individual clauses based on legal numbering heuristics.
 *
 * @param {string} sanitizedText - Safe sanitized text
 * @param {string} [originalText] - Optional original text kept locally on client
 * @returns {Array<{ id: string, clauseNumber: string, sanitizedText: string, originalText: string }>}
 */
export function segmentDocumentClauses(sanitizedText, _originalText = '') {
  if (!sanitizedText || typeof sanitizedText !== 'string') {
    return [];
  }

  // Split on legal clause markers (e.g., "1.", "Section 2:", "Clause 3:", "\n\n")
  const clausePattern = /(?:^|\n+)(?:(\d+[.)]|Section\s+\d+:?|Clause\s+\d+:?|Article\s+[IVXLCDM]+:?)\s+)/gi;

  const rawMatches = [];
  let match;
  while ((match = clausePattern.exec(sanitizedText)) !== null) {
    rawMatches.push({
      clauseNumber: match[1] || `Clause ${rawMatches.length + 1}`,
      startIndex: match.index,
    });
  }

  // If no formal numbering matched, fall back to paragraph block splitting
  if (rawMatches.length === 0) {
    const paragraphs = sanitizedText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    return paragraphs.map((text, idx) => ({
      id: `clause-${idx + 1}`,
      clauseNumber: `Section ${idx + 1}`,
      sanitizedText: text,
      originalText: text,
    }));
  }

  const clauses = [];
  for (let i = 0; i < rawMatches.length; i++) {
    const current = rawMatches[i];
    const next = rawMatches[i + 1];
    const chunk = next
      ? sanitizedText.slice(current.startIndex, next.startIndex).trim()
      : sanitizedText.slice(current.startIndex).trim();

    if (chunk.length > 10) {
      clauses.push({
        id: `clause-${i + 1}`,
        clauseNumber: current.clauseNumber.replace(/[.:)]/g, '').trim(),
        sanitizedText: chunk,
        originalText: chunk, // Will be paired with original if provided
      });
    }
  }

  return clauses;
}
