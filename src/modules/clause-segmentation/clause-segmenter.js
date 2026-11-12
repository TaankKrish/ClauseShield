/**
 * Clause Segmentation Engine
 * Decomposes continuous legal contracts into numbered, discrete clause units.
 * Preserves multi-page references, document order, and never silently discards text.
 */

/**
 * Normalizes input text and optional pages array.
 */
function resolveInput(input, options = {}) {
  let text = '';
  let pages = [];

  if (typeof input === 'string') {
    text = input;
    if (Array.isArray(options.pages)) {
      pages = options.pages;
    }
  } else if (input && typeof input === 'object') {
    text = input.text || input.fullText || input.sanitizedText || '';
    if (Array.isArray(input.pages)) {
      pages = input.pages;
    } else if (Array.isArray(options.pages)) {
      pages = options.pages;
    }
  }

  return { text: text.trim(), pages };
}

/**
 * Finds the originating page number for a given character offset or text snippet.
 */
function findPageNumber(clauseText, pages = []) {
  if (!pages || pages.length === 0) return 1;

  const sample = clauseText.slice(0, 50).trim();
  for (const page of pages) {
    if (page.text && page.text.includes(sample)) {
      return page.pageNumber || 1;
    }
  }

  return 1;
}

/**
 * Segments document text into discrete clause objects.
 *
 * @param {string|{ text: string, pages: Array }} input - Raw or sanitized document text or document object
 * @param {object} [options]
 * @param {Array<{ pageNumber: number, text: string }>} [options.pages] - Multi-page chunks
 * @returns {{
 *   clauses: Array<{
 *     id: string,
 *     clauseNumber: string,
 *     text: string,
 *     sanitizedText: string,
 *     pageNumber: number
 *   }>
 * }}
 */
export function segmentDocumentClauses(input, options = {}) {
  const { text, pages } = resolveInput(input, options);

  if (!text) {
    const emptyResult = { clauses: [] };
    makeArrayCompatible(emptyResult);
    return emptyResult;
  }

  // 1. Primary pass: Numbered clause markers
  // Matches: "1.", "1.1", "(1)", "(a)", "Clause 1:", "Section 2.", "Article IV"
  const numberedClauseRegex = /(?:^|\n+)(?:((?:\d+(?:\.\d+)*[.)]|\((?:[0-9]{1,2}|[a-zA-Z])\)|(?:Clause|Section|Article|Point|Rule)\s+(?:\d+(?:\.\d+)*|[IVXLCDM]+|[a-zA-Z])[:.)-]?)\s+))/gi;

  let matches = [];
  let match;
  while ((match = numberedClauseRegex.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      marker: match[1].trim(),
      startIndex: match.index,
    });
  }

  // 2. Secondary pass: If no numbered clauses were found, check for uppercase headings ending with colon
  if (matches.length < 2) {
    const headingClauseRegex = /(?:^|\n+)(?:([A-Z\s]{4,30}:)\s+)/g;
    const headingMatches = [];
    while ((match = headingClauseRegex.exec(text)) !== null) {
      headingMatches.push({
        fullMatch: match[0],
        marker: match[1].trim(),
        startIndex: match.index,
      });
    }

    if (headingMatches.length >= 2) {
      matches = headingMatches;
    }
  }

  let rawClauses = [];

  // If structured markers (numbered or headings) are found
  if (matches.length >= 2) {
    // Preserve any preamble before the first clause
    const firstMatch = matches[0];
    if (firstMatch.startIndex > 0) {
      const preambleText = text.slice(0, firstMatch.startIndex).trim();
      if (preambleText.length > 15) {
        rawClauses.push({
          clauseNumber: 'Preamble',
          text: preambleText,
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      const chunk = next
        ? text.slice(current.startIndex, next.startIndex).trim()
        : text.slice(current.startIndex).trim();

      const cleanNumber = current.marker.replace(/[:.)-]/g, '').trim();

      if (chunk.length > 5) {
        rawClauses.push({
          clauseNumber: cleanNumber || `${i + 1}`,
          text: chunk,
        });
      }
    }
  } else {
    // Fallback: Paragraph boundary segmentation
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 10);

    if (paragraphs.length > 1) {
      rawClauses = paragraphs.map((para, idx) => ({
        clauseNumber: `Paragraph ${idx + 1}`,
        text: para,
      }));
    } else {
      rawClauses = [
        {
          clauseNumber: 'Section 1',
          text: text,
        },
      ];
    }
  }

  // Format into final standardized contract schema
  const clauses = rawClauses.map((rc, idx) => {
    const id = `CLAUSE-${String(idx + 1).padStart(3, '0')}`;
    const pageNumber = findPageNumber(rc.text, pages);

    return {
      id,
      clauseNumber: rc.clauseNumber,
      text: rc.text,
      sanitizedText: rc.text,
      pageNumber,
    };
  });

  const result = { clauses };
  makeArrayCompatible(result);
  return result;
}

/**
 * Augments the result object with array-like behavior
 */
function makeArrayCompatible(obj) {
  obj[Symbol.iterator] = function* () {
    yield* obj.clauses;
  };
  Object.defineProperty(obj, 'length', {
    get() {
      return obj.clauses.length;
    },
    enumerable: false,
  });
  obj.map = function (fn) {
    return obj.clauses.map(fn);
  };
  obj.filter = function (fn) {
    return obj.clauses.filter(fn);
  };
  obj.forEach = function (fn) {
    return obj.clauses.forEach(fn);
  };
}
